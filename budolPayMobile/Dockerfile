FROM ghcr.io/cirruslabs/flutter:stable AS build
WORKDIR /app
COPY . .
RUN flutter pub get
RUN flutter build web

FROM nginx:alpine
COPY --from=build /app/build/web /usr/share/nginx/html
# Configure nginx to listen on 9000
RUN sed -i 's/80/9000/g' /etc/nginx/conf.d/default.conf
EXPOSE 9000
CMD ["nginx", "-g", "daemon off;"]
