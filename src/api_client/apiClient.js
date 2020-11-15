import axios from "axios";

import store from '../store'
import {isRefreshTokenExpired} from '../reducers/'

store.subscribe(listener)

function select(state) {
 return state.auth
}

function listener() {
 var auth = select(store.getState())
 if (auth.access) {
  axios.defaults.headers.common['Authorization'] = "Bearer " + auth.access.token;
 }
}

export var serverAddress = ""

export var Server = axios.create({
    baseURL: '/api/',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials:true,
  timeout: 30000,
});

Server.interceptors.request.use(function(request) {
	return request
}, function(error) {
})


Server.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  const originalRequest = error.config;

  if (error.response.status === 401 && !originalRequest._retry && !isRefreshTokenExpired(store.getState())) {

    originalRequest._retry = true;

    const auth = select(store.getState())
    const refreshToken = auth.refresh.token
    return Server.post(serverAddress+'/api/auth/token/refresh/', { refresh:refreshToken })
      .then((response) => {
      	store.dispatch({type: "REFRESH_ACCESS_TOKEN_FULFILLED", payload: response.data})
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access;
        originalRequest.headers['Authorization'] = 'Bearer ' + response.data.access;
        return Server(originalRequest);
      });
  }

  return Promise.reject(error);
});

export default {serverAddress, Server}
