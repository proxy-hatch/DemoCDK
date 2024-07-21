# Stage 1: Build the application using the official Go image
FROM golang:1.18 as builder

# Set the working directory inside the container
WORKDIR /app

# Install git, which may be required for fetching dependencies
RUN apt-get update && apt-get install -y git

# Copy the Go Modules manifests
COPY go.mod ./
# Download Go modules
RUN go mod download

# Copy the source code into the container
COPY . .

# Build the application to a static binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -o demoApp .

# Stage 2: Use Amazon Linux 2 as the base for the runtime container
FROM public.ecr.aws/amazonlinux/amazonlinux:latest

# Install any necessary packages
RUN yum update -y && yum install -y ca-certificates && yum clean all

# Set the working directory in the container
WORKDIR /root/

# Copy the binary from the builder stage
COPY --from=builder /app/demoApp .

# Document that the service listens on port 8080
EXPOSE 8080

# Command to run the executable
CMD ["./demoApp"]
