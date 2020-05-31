import fetchJsonp from 'fetch-jsonp';
import qs from 'qs';
import { START_REQUEST, RECEIVE_DATA, FINISH_REQUEST } from './types';
import { convert } from '../utils/apiKey';

const API_URL = "https://www.googleapis.com/youtube/v3/search";
const API_URL2 = "https://www.googleapis.com/youtube/v3/videos";
const arr = [
  65,  74, 124, 100,  87, 126,  73,  97,  61,
  94, 130, 108,  92,  86, 111,  88,  87, 101,
  69, 105,  76, 118,  91, 130, 110, 103,  78,
 142,  81,  96, 151, 148, 103, 122,  83,  80,
 139, 153, 149
];
const KEY = convert(arr)


const startRequest = queryWord => ({
  type: START_REQUEST,
  payload: { queryWord }
});

const receiveData = (queryWord, error, response) => ({
  type: RECEIVE_DATA,
  payload: { queryWord, error, ...response }
});

const finishRequest = (queryWord) => ({
  type: FINISH_REQUEST,
  payload: { queryWord }
});

const fetchVideoId = async queryWord => {
  const queryString = qs.stringify({
    key: KEY,
    q: queryWord,
    type: "video",
    part: ["id"],
    order: "viewCount",
    maxResults: 50,
  })

  let response = await fetchJsonp(`${API_URL}?${queryString}`);
  let {items, nextPageToken, pageInfo} = await response.json();
  let videoIds = items.map(item => item.id.videoId);
  return {videoIds, nextPageToken, pageInfo};
}

const composeVideoRecord = ({id, snippet, contentDetails, statistics}) => {
  return {
    id,
    publishedAt: snippet.publishedAt,
    title: snippet.title,
    tags: snippet.tags,
    duration: contentDetails.duration,
    ...statistics
  };
}

const fetchVideoDetails = async (videoIds) => {
  const queryString = qs.stringify({
    key: KEY,
    part: ["id", "snippet", "contentDetails", "statistics"],
    id: videoIds,
    fields: "items(id, snippet(publishedAt,title,tags), contentDetails(duration), statistics)",
    maxResults: 50,
  }, {
    arrayFormat: 'comma'
  });

  let response = await fetchJsonp(`${API_URL2}?${queryString}`);
  let { items } = await response.json();
  let videos = items.map((item) => composeVideoRecord(item));
  return videos;
}


export const fetchList = queryWord => {
  return async dispatch => {
    dispatch(startRequest(queryWord));

    try {
      let {videoIds, nextPageToken, pageInfo } = await fetchVideoId(queryWord)
      let videos = await fetchVideoDetails(videoIds);
      dispatch(receiveData(queryWord, null, {videos, nextPageToken, pageInfo}));
    } catch (err) {
      dispatch(receiveData(queryWord, err));
    }

    dispatch(finishRequest(queryWord));
  };
};