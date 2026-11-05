FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY public ./public
COPY src ./src

ARG REACT_APP_API_URL
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_ANON_KEY=$REACT_APP_SUPABASE_ANON_KEY
ENV DISABLE_ESLINT_PLUGIN=true

RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/build /usr/share/nginx/html
# La imagen oficial de nginx pasa los templates por envsubst al arrancar
# (solo reemplaza variables definidas: $uri y las demás de nginx quedan intactas).
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV AUTH_GATEWAY=http://iurivia-gateway
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
