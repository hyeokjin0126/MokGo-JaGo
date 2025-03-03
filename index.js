const mapContainer = document.querySelector("#map_Area");
const placeResult_Area = document.querySelector("#placeResult_Area");
const keywordInput = document.querySelector("#search_Area input[type='text']");

var mapOption = { center: new kakao.maps.LatLng(37.5665, 126.9780), level: 3 }; // 기본 위치 (서울)
var kakao_map = new kakao.maps.Map(mapContainer, mapOption); // kakao map
var kakao_places = new kakao.maps.services.Places(); // kakao places
var kakao_infowindow = new kakao.maps.InfoWindow({ zIndex: 1 }); // kakao infowindow
var currentLat, currentLng; // 위도, 경도

var markers = [];
var placeList = [];


// 현재 위치 설정
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;
        kakao_map.setCenter( new kakao.maps.LatLng(currentLat, currentLng), 3 ); // 현재 위치 설정
        placeSearch(); // 기본 키워드로 검색 시작
    });
} 
else {
    alert("위치 정보를 가져올 수 없습니다.");
}


// 인풋 Enter 이벤트 > 검색
keywordInput.addEventListener("keydown", function (event) { if (event.key === "Enter") { placeSearch() } });
// 검색 버튼 클릭 이벤트 > 검색
document.querySelector("#search_Area button").addEventListener("click", function () { placeSearch() }); 
// radio 버튼 클릭 이벤트 > 검색
document.querySelectorAll("#search_Area input[name='searchOption']").forEach(element => {
    element.addEventListener("click", function(event){
        if(event.target.value=="recommendation"){ displayPlaces(placeList) }
        else if(event.target.value=="shortestTime"){displayPlaces( placeList.slice().sort((a, b) => parseInt(a.walkMin) - parseInt(b.walkMin)) )}
    })
})
// 초기화 > 검색
document.querySelector('#resetSelect').addEventListener('click', function() {
    keywordInput.value=''; 
    placeSearch()
})
// 랜덤뽑기 > 검색
document.querySelector('#randomSelect').addEventListener('click', function() {
    if (placeList.length === 0) { return alert('검색된 결과가 없습니다.') }
    const randomIndex = Math.floor(Math.random() * placeList.length);
    markerRemove()
    displayPlaces([placeList[randomIndex]])
});


// 키워드로 모든 페이지 결과 가져오기
function placeSearch() {
    const text = keywordInput.value.trim() || "음식점";
    placeList = [];
    
    // 검색 전에 기존 마커들을 모두 삭제
    markerRemove();
    placeResult_Area.innerHTML = "";
    
    let page = 1;

    // 위치 설정
    navigator.geolocation.getCurrentPosition(function (position) {
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;
        var locPosition = new kakao.maps.LatLng(currentLat, currentLng);
        kakao_map.setCenter(locPosition); // 지도 중심 이동
    });
    
    kakao_places.keywordSearch(text, function (data, status, pagination) {
        if (status === kakao.maps.services.Status.OK) {
            placeList = placeList.concat(time_Return(data));
            if (pagination.hasNextPage) { page++; pagination.nextPage(); } // 다음 페이지 수집
            else { displayPlaces(placeList); } // 결과 출력
        } 
        else { alert("검색 결과가 없습니다.") }
    }, { location: new kakao.maps.LatLng(currentLat, currentLng), radius: 300, page: page }); // km 제한 300 = 3km
}

function time_Return(data) {
    if(typeof(data)=="object"){
        data.forEach(d => {
            if (!d.distance) return;
            var walkTime = d.distance / 67 | 0;
            d.walkHour = walkTime >= 60 ? `${Math.floor(walkTime / 60)}시간` : '';
            d.walkMin = `${walkTime % 60}분`;
        });
    }
    return data;
}




// 지도에 Marker 만들기
function markerAdd(place) {
    // 지도에 Marker 만들기
    var marker = new kakao.maps.Marker({ map: kakao_map, position: new kakao.maps.LatLng(place.y, place.x) });
    markers.push(marker);

    kakao.maps.event.addListener(marker, "click", function () {
        kakao_infowindow.setContent(`<div style="padding:5px;">${place.place_name}</div>`);
        kakao_infowindow.open(kakao_map, marker);
    });
}

// 지도에서 Marker 모두 삭제
function markerRemove() {
    markers.forEach(function(marker) { marker.setMap(null) });
    markers = [];
}

// 음식점 목록 및 지도 마커 추가
function displayPlaces(places) {
    placeResult_Area.innerHTML = "";
    places.forEach((place, cnt) => {
        placeResult_Area.innerHTML+=`
            <div class="placeResult_Container">
                <div class="placeResult_Title">
                    <div style="display: flex; gap: 15px;">
                        <span style="font-size: 34px; color: var(--blue)"> A${++cnt} </span>
                        <strong>${place.place_name} <span> ${place.category_name.split(" > ").pop()} <span> </strong>
                    </div>
                    <div style="display: flex; gap: 15px;">
                        <button onclick="markerRemove(); markerAdd(placeList[${cnt}])">
                            <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="#FFE300" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                            위치 표시 
                        </button> 
                        <button onclick="window.open('${place.place_url}')">
                            <svg width="30px" height="30px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3.37892 10.2236L8 16L12.6211 10.2236C13.5137 9.10788 14 7.72154 14 6.29266V6C14 2.68629 11.3137 0 8 0C4.68629 0 2 2.68629 2 6V6.29266C2 7.72154 2.4863 9.10788 3.37892 10.2236ZM8 8C9.10457 8 10 7.10457 10 6C10 4.89543 9.10457 4 8 4C6.89543 4 6 4.89543 6 6C6 7.10457 6.89543 8 8 8Z" fill="#FFE300"></path> </g></svg>
                            카카오맵 열기 
                        </button> 
                    </div>
                </div>
                <div class="placeResultTime"> 도보 ${place.walkHour} ${place.walkMin} </div>
                <div> ${place.distance}m ${place.address_name} </div>
            </div>
        `
        markerAdd(place);
    });
}