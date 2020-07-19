FROM rust:1.40 as builder
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
WORKDIR /opt/app
COPY --from=builder /usr/local/cargo/bin/stoichkitweb app
COPY web/ web/
ENV RUST_LOG=INFO
CMD ["./app"]
