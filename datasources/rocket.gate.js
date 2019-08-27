/* eslint-disable no-underscore-dangle */
const { RESTDataSource } = require('apollo-datasource-rest');
const _ = require('lodash');

class RocketChatAPI extends RESTDataSource {
  constructor({ baseURL, authToken, userId }) {
    super();

    this.appURL = baseURL;
    this.baseURL = `${baseURL}/api/v1/`;
    this.authToken = authToken;
    this.userId = userId;
  }

  willSendRequest(request) {
    request.headers.set('X-Auth-Token', this.authToken);
    request.headers.set('X-User-Id', this.userId);
  }

  messageSearchResultReducer(message, roomInfo) {
    return {
      id: message._id,
      message: message.msg,
      url: `${this.appURL}/channel/${roomInfo.name}?msg=${message._id}`,
      author: message.u.name,
      time: message.ts,
      roomId: roomInfo.id,
      room: {
        id: roomInfo.id,
        name: roomInfo.name,
      },
    };
  }

  static roomInfoReducer(room) {
    return {
      id: room._id,
      name: room.name,
    };
  }

  async searchRoom({ roomId, searchString }) {
    const roomInfoResponse = await this.get('rooms.info', { roomId });

    const roomInfo = RocketChatAPI.roomInfoReducer(roomInfoResponse.room);

    const response = await this.get('chat.search', { searchText: searchString, roomId });

    return Array.isArray(response.messages)
      ? response.messages.map((message) => this.messageSearchResultReducer(message, roomInfo))
      : [];
  }

  async searchRooms({ roomIds, searchString }) {
    const allSearchResultsArrays = await Promise.all(
      roomIds.map((roomId) => this.searchRoom({ roomId, searchString })),
    );

    return _.flatten(allSearchResultsArrays);
  }

  async getRoomInfo({ roomId }) {
    const response = await this.get('rooms.info', { roomId });

    return response.room;
  }
}

module.exports = RocketChatAPI;
