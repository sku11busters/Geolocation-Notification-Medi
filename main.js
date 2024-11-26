/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/js/checkCoordinatesValidity.js
function checkCoordinatesValidity(inputValue) {
  let newValue;
  const validObj = {};
  if (inputValue.startsWith("[") && inputValue.endsWith("]")) {
    newValue = inputValue.slice(1, inputValue.length - 1).split(",");
  } else {
    newValue = inputValue.split(",");
  }
  if (newValue.length !== 2) return validObj;
  const lat = parseFloat(newValue[0].trim());
  const lng = parseFloat(newValue[1].trim());
  if (!Number.isNaN(lat) && Math.abs(lat) <= 90) {
    validObj.lat = lat;
  }
  if (!Number.isNaN(lng) && Math.abs(lng) <= 180) {
    validObj.lng = lng;
  }
  return validObj;
}
;// CONCATENATED MODULE: ./src/js/timerFunction.js
/* eslint-disable no-param-reassign */
function timerFunction(minutes, seconds) {
  const sec = (+seconds.innerText + 1) % 60;
  if (sec < 10) seconds.innerText = `0${sec}`;
  if (sec >= 10) seconds.innerText = sec;
  if (sec === 0) {
    const min = +minutes.innerText + 1;
    if (min < 10) minutes.innerText = `0${min}`;
    if (min >= 10) minutes.innerText = min;
  }
}
;// CONCATENATED MODULE: ./src/js/popupMessage.js
class PopupMessage {
  constructor() {
    this.container = document.querySelector(".main_container");
  }
  showMessage() {
    if (this.container.querySelector("[data-modal=modal]")) return;
    const modalHtml = `
    <div data-modal="modal" class="modal">
      <div data-id="modalNotification" class="modal_content modal_notification">
        <div>
          <p>Что-то пошло не так</p>
          <p>К сожалению, не удалось ничего записать,
            пожалуйста, дайте разрешение на использование записи,
            либо воспользуйтесь другим браузером</p>          
        </div>
        <button type="submit" data-id="modalButtonOk" class="modal_button button_ok">Ок</button> 
      </div>
    </div>
    `;
    this.container.insertAdjacentHTML("afterBegin", modalHtml);
    const modalPopup = this.container.querySelector("[data-modal=modal]");
    const modalButtonOK = modalPopup.querySelector("[data-id=modalButtonOk]");
    modalButtonOK.addEventListener("click", event => {
      event.preventDefault();
      modalPopup.remove();
    });
  }
}
;// CONCATENATED MODULE: ./src/js/recordingFunction.js


async function recordingFunction(mediatype) {
  if (!navigator.mediaDevices) {
    console.log("navigator.mediaDevices not available");
    return false;
  }
  let mediaContent;
  const mediaType = mediatype;
  try {
    if (!window.MediaRecorder) {
      console.log("window.MediaRecorder not available");
      return false;
    }
    const container = document.querySelector(".main_container");
    const timer = container.querySelector("[data-id=timelineRecordTime]");
    const minutes = timer.querySelector("[data-timer=timerMinutes]");
    const seconds = timer.querySelector("[data-timer=timerSecondes]");
    minutes.innerText = "00";
    seconds.innerText = "00";
    const submitButton = container.querySelector("[data-id=timelineSubmitRecordButton]");
    const cancelButton = container.querySelector("[data-id=timelineCancelRecordButton]");
    const widgetTimelineForm = container.querySelector("[data-id=timelineForm]");
    let timerId;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia is not supported on this browser.");
      return false;
    }
    const media = document.createElement(`${mediaType}`);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mediaType === "video"
    });
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    const videoPlayer = document.createElement("div");
    if (mediaType === "video") {
      videoPlayer.classList.add("video_player");
      media.srcObject = stream;
      media.play();
      media.controls = true;
      media.muted = "muted";
      videoPlayer.append(media);
      widgetTimelineForm.before(videoPlayer);
    }
    const submitRecord = () => {
      recorder.stop();
      submitButton.removeEventListener("click", submitRecord);
    };
    const cancelRecord = () => {
      recorder.stop();
      cancelButton.removeEventListener("click", cancelRecord);
    };
    recorder.addEventListener("start", () => {
      console.log("recording started");
      timerId = setInterval(() => timerFunction(minutes, seconds), 1000);
    });
    recorder.addEventListener("dataavailable", evt => {
      console.log("data available");
      chunks.push(evt.data);
    });
    submitButton.addEventListener("click", submitRecord);
    cancelButton.addEventListener("click", cancelRecord);
    recorder.addEventListener("stop", () => {
      const blob = new Blob(chunks);
      media.src = URL.createObjectURL(blob);
      media.controls = true;
      clearInterval(timerId);
      stream.getTracks().forEach(track => track.stop());
      media.srcObject = null;
      videoPlayer.remove();
    });
    recorder.start();
    mediaContent = media;
  } catch (e) {
    console.error(e);
    const popup = new PopupMessage();
    popup.showMessage();
  }
  return mediaContent;
}
;// CONCATENATED MODULE: ./src/js/widgetTimeLine.js


class WidgetTimeLine {
  constructor() {
    this.container = document.querySelector(".main_container");
  }
  initHandlers() {
    this.postForm = this.container.querySelector("[data-id=timelineForm]");
    this.controlBar = this.container.querySelector("[data-id=timelineControls]");
    this.buttonAudio = this.container.querySelector("[data-id=timelineAudioButton]");
    this.buttonVideo = this.container.querySelector("[data-id=timelineVideoButton]");
    this.buttonSubmitRecord = this.container.querySelector("[data-id=timelineSubmitRecordButton]");
    this.buttonCancelRecord = this.container.querySelector("[data-id=timelineCancelRecordButton]");
    this.postForm.addEventListener("submit", event => {
      this.submitPost(event);
    });
    this.controlBar.addEventListener("click", event => {
      if (!event.target.closest(".timeline_button")) return;
      this.toggleControls();
    });
    this.buttonAudio.addEventListener("click", _ref => {
      let {
        target
      } = _ref;
      this.recordByMediaType(target);
    });
    this.buttonVideo.addEventListener("click", _ref2 => {
      let {
        target
      } = _ref2;
      this.recordByMediaType(target);
    });
    this.buttonSubmitRecord.addEventListener("click", () => {
      if (this.postContent) this.checkGeoLocAPI(this.postContent);
    });
    this.buttonCancelRecord.addEventListener("click", () => {
      this.postContent = null;
    });
  }
  async recordByMediaType(eventTarget) {
    this.mediaType = undefined;
    if (eventTarget.closest(".audio_button")) this.mediaType = "audio";
    if (eventTarget.closest(".video_button")) this.mediaType = "video";
    const mediaRecord = await recordingFunction(`${this.mediaType}`);
    if (mediaRecord) this.postContent = mediaRecord;
    if (!this.postContent) this.toggleControls();
  }
  toggleControls() {
    [...this.controlBar.children].forEach(controlBarEl => controlBarEl.classList.toggle("hidden"));
  }
  showModalManualCoords() {
    if (this.container.querySelector("[data-modal=modal]")) return;
    const modalManualCoordsHtml = `
    <div data-modal="modal" class="modal">
      <div data-id="modalManualCoords" class="modal_content modal_manual_coords">
        <div>
          <p>Что-то пошло не так</p>
          <p>К сожалению, нам не удалось определить ваше местоположение, пожалуйста, дайте разрешение на использование геолокации, либо введите координаты вручную</p>
          <p>Широта и долгота через запятую</p>
        </div>
        <form data-id="modalForm" class="modal_form">
          <input data-id="modalInput" name="coords" class="modal_input" placeholder="Введите координаты, например: -90.12345, 180.12345" required>
          <div class="modal_footer">
            <span class="modal_footer_string hidden">
            </span>
          </div> 
          <div class="modal_form_controls"> 
            <button type="reset" data-id="modalButtonCancel" class="modal_button button_cancel">Отмена</button> 
            <button type="submit" data-id="modalButtonOk" class="modal_button button_ok">Ок</button> 
          </div>
        </form>       
      </div>
    </div>
    `;
    this.container.insertAdjacentHTML("afterBegin", modalManualCoordsHtml);
    const modalPopup = this.container.querySelector("[data-modal=modal]");
    const modalForm = modalPopup.querySelector("[data-id=modalForm]");
    modalForm.setAttribute("novalidate", true);
    modalForm.addEventListener("reset", () => {
      modalForm.closest("[data-modal=modal]").remove();
      this.addPost(this.postContent);
    });
    modalForm.addEventListener("input", () => {
      if (modalForm.coords.classList.contains("invalid")) modalForm.coords.classList.remove("invalid");
    });
    modalForm.addEventListener("submit", event => {
      event.preventDefault();
      const inputValue = modalForm.coords.value.trim();
      modalForm.coords.setCustomValidity("");
      const formValidity = checkCoordinatesValidity(inputValue);
      this.coordsObj = formValidity;
      const errorMessageCoords = "Координаты введены некорректно.";
      const errorMessageLat = "Широта должна быть в пределах -90...+90 градусов.";
      const errorMessageLng = "Долгота должна быть в пределах -180...+180 градусов.";
      modalForm.coords.classList.add("invalid");
      if (inputValue === "") {
        modalForm.coords.reportValidity();
        return;
      }
      if (!this.coordsObj.lng && !this.coordsObj.lat) {
        const errorMessage = `
        ${errorMessageCoords}
        ${errorMessageLat}
        ${errorMessageLng}
        `;
        modalForm.coords.setCustomValidity(errorMessage);
        modalForm.coords.reportValidity();
        return;
      }
      if (this.coordsObj.lng && !this.coordsObj.lat) {
        const errorMessage = `
        ${errorMessageCoords}
        ${errorMessageLat}
        `;
        modalForm.coords.setCustomValidity(errorMessage);
        modalForm.coords.reportValidity();
        return;
      }
      if (!this.coordsObj.lng && this.coordsObj.lat) {
        const errorMessage = `
        ${errorMessageCoords}
        ${errorMessageLng}
        `;
        modalForm.coords.setCustomValidity(errorMessage);
        modalForm.coords.reportValidity();
        return;
      }
      this.addPost(this.postContent, this.coordsObj.lat, this.coordsObj.lng);
      modalPopup.remove();
    });
  }
  init() {
    if (this.container.querySelector("[data-widget=timelineWidget]")) return;
    const widgetTimelineHtml = `
        <div data-widget="timelineWidget" class="timeline_widget">
          <div data-id="timelinePosts" class="timeline_posts">
          </div>    
          <form data-id="timelineForm" class="modal_form timeline_form">
            <input data-id="post" name="post" placeholder="Post something here..." class="timeline_input" required>   
            <div data-id="timelineControls" class="timeline_controls">
              <div data-id="timelineAudioButton" class="timeline_button audio_button">
                <span>&#127908;</span>
              </div>
              <div data-id="timelineVideoButton" class="timeline_button video_button">
                <span>&#127909;</span>
              </div>
              <div data-id="timelineSubmitRecordButton" class="hidden timeline_button submit_record_button">
                <span>&#10004;</span>
              </div>
              <div data-id="timelineRecordTime" class="hidden timeline_record_time">
                <span data-timer="timerMinutes">00</span>:<span data-timer="timerSecondes">00</span>
              </div>
              <div data-id="timelineCancelRecordButton" class="hidden timeline_button cancel_record_button">
                <span>&#10006;</span>
              </div>
            </div>
          </form>
        </div> 
      `;
    this.container.insertAdjacentHTML("afterBegin", widgetTimelineHtml);
    this.initHandlers();
  }
  submitPost(event) {
    event.preventDefault();
    const inputValue = this.postForm.post.value.trim();
    if (inputValue === "") return;
    this.postContent = inputValue;
    this.checkGeoLocAPI(this.postContent);
    this.postForm.reset();
  }
  checkGeoLocAPI(postContent) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const {
          latitude,
          longitude
        } = position.coords;
        this.addPost(postContent, latitude, longitude);
      }, error => {
        console.error(error);
        this.showModalManualCoords();
      });
    } else {
      console.log("browser geo API - false");
      this.showModalManualCoords();
    }
  }
  addPost(postContent, latitude, longitude) {
    const postBoard = this.container.querySelector("[data-id=timelinePosts]");
    if (!postBoard) return;
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    let coordinates;
    if (latitude && longitude) {
      coordinates = `[${latitude}, ${longitude}]`;
    } else {
      coordinates = "[-,-]";
    }
    const postElement = document.createElement("div");
    const timeStampEl = document.createElement("span");
    const postContentEl = document.createElement("div");
    const coordsEl = document.createElement("span");
    postElement.classList.add("post_content");
    postElement.dataset.id = "postContent";
    timeStampEl.innerText = `${date} ${time}`;
    postContentEl.append(postContent);
    coordsEl.innerHTML = `${coordinates} &#128065;`;
    postElement.append(timeStampEl);
    postElement.append(postContentEl);
    postElement.append(coordsEl);
    postBoard.prepend(postElement);
    this.postContent = null;
  }
}
;// CONCATENATED MODULE: ./src/js/app.js

const widgetTimeLine = new WidgetTimeLine();
widgetTimeLine.init();
;// CONCATENATED MODULE: ./src/index.js



// TODO: write your code in app.js
/******/ })()
;
//# sourceMappingURL=main.js.map