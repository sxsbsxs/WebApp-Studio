FROM eclipse-temurin:17-jdk-jammy
ENV ANDROID_SDK_ROOT=/opt/android-sdk ANDROID_HOME=/opt/android-sdk
ENV PATH=${PATH}:/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools
RUN apt-get update && apt-get install -y --no-install-recommends unzip zip curl git && rm -rf /var/lib/apt/lists/*
RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools && cd /tmp && curl -fsSLo cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && unzip -q cmdline-tools.zip && mv cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest && rm cmdline-tools.zip
RUN yes | sdkmanager --licenses >/dev/null && sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
COPY build.sh /usr/local/bin/build-android-project
RUN chmod 755 /usr/local/bin/build-android-project
WORKDIR /work
ENTRYPOINT ["/usr/local/bin/build-android-project"]
