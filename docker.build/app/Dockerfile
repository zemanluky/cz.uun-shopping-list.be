# first stage - build
# start with bun
FROM oven/bun:1-debian AS build

# work from the volume directory
WORKDIR /app
COPY bun.lockb .
COPY package.json .

# install packages
RUN bun install --frozen-lockfile

# copy the source code and server start file
COPY src /app/src
COPY index.ts /app/index.ts

# compile everything to a binary called cli which includes the bun runtime
ENV NODE_ENV=production
RUN bun build --compile --minify --sourcemap ./index.ts --outfile server

# second stage - run
# start with a clean ubuntu image
FROM ubuntu:24.04
WORKDIR /app

# copy the compiled binary from the build image
COPY --from=build /app/server /app/server

# execute the binary as the express server
SHELL ["/bin/bash", "-c"]
CMD ./server