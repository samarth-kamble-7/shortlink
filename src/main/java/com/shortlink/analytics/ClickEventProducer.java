package com.shortlink.analytics;

import com.shortlink.sharding.ShardRouter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

/**
 * Non-blocking asynchronous producer for click analytics events.
 * Dispatches Kafka sends on a Java 25 Virtual Thread so user redirects
 * never wait on broker metadata fetches or serialization.
 */
@Slf4j
@Service
public class ClickEventProducer {

    private static final String METRIC_NAME = "shortlink.analytics.events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final JsonMapper jsonMapper;
    private final MeterRegistry meterRegistry;
    private final ClickEventBatchRepository batchRepository;
    private final GeoIpService geoIpService;
    private final ShardRouter shardRouter;
    private final String clicksTopic;
    private final boolean kafkaEnabled;

    public ClickEventProducer(
            KafkaTemplate<String, String> kafkaTemplate,
            JsonMapper jsonMapper,
            MeterRegistry meterRegistry,
            ClickEventBatchRepository batchRepository,
            GeoIpService geoIpService,
            ShardRouter shardRouter,
            @Value("${shortlink.analytics.clicks-topic:shortlink.clicks}") String clicksTopic,
            @Value("${shortlink.analytics.kafka-enabled:true}") boolean kafkaEnabled) {
        this.kafkaTemplate = kafkaTemplate;
        this.jsonMapper = jsonMapper;
        this.meterRegistry = meterRegistry;
        this.batchRepository = batchRepository;
        this.geoIpService = geoIpService;
        this.shardRouter = shardRouter;
        this.clicksTopic = clicksTopic;
        this.kafkaEnabled = kafkaEnabled;
    }

    /**
     * Fires a ClickEvent asynchronously without blocking the HTTP 302 redirect path.
     * Uses Kafka when enabled, or falls back to direct Virtual Thread DB persistence
     * when running without a Kafka broker (e.g., lightweight single-container deploys).
     */
    public void publishClick(String shortCode, String longUrl, String clientIp, String userAgent, String referrer) {
        ClickEvent event = ClickEvent.create(shortCode, longUrl, clientIp, userAgent, referrer);

        if (!kafkaEnabled) {
            Thread.startVirtualThread(() -> {
                try {
                    UserAgentParser.DeviceAndBrowser deviceAndBrowser = UserAgentParser.parse(event.userAgent());
                    GeoLocation location = geoIpService.resolve(event.clientIp());

                    ClickEventEntity entity = ClickEventEntity.builder()
                            .eventId(event.eventId())
                            .shortCode(event.shortCode())
                            .longUrl(event.longUrl())
                            .clientIp(event.clientIp())
                            .userAgent(event.userAgent())
                            .referrer(event.referrer())
                            .deviceType(deviceAndBrowser.deviceType())
                            .browser(deviceAndBrowser.browser())
                            .country(location.country())
                            .countryCode(location.countryCode())
                            .city(location.city())
                            .clickedAt(event.clickedAt())
                            .build();

                    String shard = shardRouter.resolveShard(event.shortCode());
                    shardRouter.executeExplicit(shard, () -> {
                        batchRepository.saveAllIdempotent(List.of(entity));
                        return null;
                    });
                    recordOutcome("direct_persisted");
                } catch (Exception ex) {
                    log.warn("Error persisting fallback ClickEvent '{}' for '{}': {}",
                            event.eventId(), shortCode, ex.getMessage());
                    recordOutcome("failed");
                }
            });
            return;
        }

        Thread.startVirtualThread(() -> {
            try {
                String payload = jsonMapper.writeValueAsString(event);
                kafkaTemplate.send(clicksTopic, event.shortCode(), payload)
                        .whenComplete((result, ex) -> {
                            if (ex != null) {
                                log.warn("Failed to publish ClickEvent '{}' for '{}': {}",
                                        event.eventId(), shortCode, ex.getMessage());
                                recordOutcome("failed");
                            } else {
                                recordOutcome("sent");
                            }
                        });
            } catch (Exception ex) {
                log.warn("Error dispatching ClickEvent '{}' for '{}': {}",
                        event.eventId(), shortCode, ex.getMessage());
                recordOutcome("failed");
            }
        });
    }

    private void recordOutcome(String outcome) {
        meterRegistry.counter(METRIC_NAME, "outcome", outcome).increment();
    }
}

