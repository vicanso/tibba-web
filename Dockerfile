FROM node:22-alpine AS webbuilder

COPY . /tibba-web
RUN apk update \
    && apk add git make \
    && cd /tibba-web \
    && npm install \
    && npm run  build 


FROM vicanso/static 

COPY --from=webbuilder /tibba-web/dist /static

CMD ["static-serve"]

ENTRYPOINT ["/entrypoint.sh"]
