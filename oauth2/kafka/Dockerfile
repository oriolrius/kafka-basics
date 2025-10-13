FROM quay.io/strimzi/kafka:0.47.0-kafka-4.0.0

COPY libs/* /opt/kafka/libs/strimzi/
COPY config/* /opt/kafka/config/
COPY *.sh /opt/kafka/
COPY certificates/*.p12 /tmp/kafka/

USER root
RUN chmod +x /opt/kafka/*.sh && mkdir -p /opt/kafka/logs && chown 1001:0 /opt/kafka/logs
USER kafka

CMD ["/bin/bash", "/opt/kafka/start.sh"]