FROM node:16
# FROM opencoconut/ffmpeg

RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install ffmpeg -y

# Start the app
WORKDIR /usr/src/app
# COPY ["package.json", "package-lock.json*", "./"]
# COPY . .
COPY package.json ./
# ENV PORT 8081
# ENV HOST 0.0.0.0

RUN npm install
# RUN yarn install

# EXPOSE 8081
COPY . .
CMD [ "npm", "start" ]