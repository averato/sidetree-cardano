FROM denoland/deno

ENV PORT=3000
ENV DENO_RUN_FILE="src/cardano.ts"

EXPOSE $PORT 
WORKDIR /app
ADD . /app
COPY . /app

RUN deno cache  /app/$DENO_RUN_FILE 
CMD ["deno run", "--allow-all --cached-only", $DENO_RUN_FILE]
