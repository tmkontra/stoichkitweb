# build server
FROM rust:1.45-buster as builder
RUN apt-get update
RUN apt-get install -y libgmp10 libgmp-dev libmpfr-dev m4 gfortran

WORKDIR /usr/src/stoichkitweb
COPY Cargo.toml Cargo.lock ./
RUN mkdir src/
RUN echo "fn main() {println!(\"if you see this, the build broke\")}" > src/main.rs
RUN cargo build --release
RUN rm -f target/release/deps/stoichkitweb*

COPY src ./src
RUN cargo build --release
RUN cargo install --path .

FROM debian:buster-slim
RUN apt-get update
RUN apt-get install -y libgmp10 libgmp-dev libmpfr-dev m4 gfortran
COPY --from=builder /usr/local/cargo/bin/stoichkitweb /bin
ENV RUST_LOG=INFO
CMD ["stoichkitweb"]
