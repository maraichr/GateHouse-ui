FROM golang:1.25-alpine

RUN apk add --no-cache git

# Install air for hot reload
RUN go install github.com/air-verse/air@latest

WORKDIR /app

# Cache Go module downloads
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY cmd/ cmd/
COPY internal/ internal/
COPY pkg/ pkg/
COPY docs/ docs/
COPY .air.docker.toml .air.toml

EXPOSE 3000

CMD ["air"]
