# -------- DEV MODE --------
FROM node:20-bullseye

# cria usuário normal
RUN useradd -m app
WORKDIR /app

# copia apenas manifestos
COPY package*.json ./

# instala deps
RUN npm install

# copia código
COPY . .

# corrige permissões
RUN chown -R app:app /app
RUN mkdir -p /app/.next /app/node_modules/.cache /tmp/.next \
 && chown -R app:app /app /tmp

EXPOSE 3000
CMD ["npm", "run", "dev"]
