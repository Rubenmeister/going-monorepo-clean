FROM nginx:alpine

# COPIA CORREGIDA: Apunta directo a la carpeta de la webapp
COPY dist/frontend-webapp /usr/share/nginx/html
COPY apps/frontend-webapp/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
