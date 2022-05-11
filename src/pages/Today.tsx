import React, { FC, useEffect, useState } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

const Today: FC = () => {
  const [latitude, setLatitude] = useState<number>(33.450701);
  const [longitude, setLongitude] = useState<number>(126.570667);

  useEffect(() => {
    const container = document.getElementById('map');
    const options = {
      center: new window.kakao.maps.LatLng(latitude, longitude),
      level: 3,
    };

    const map = new window.kakao.maps.Map(container, options);

    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.addressSearch(
      '제주특별자치도 제주시 첨단로 242',
      (result: any, status: any) => {
        if (status === 'OK') {
          result.map((v: any) => {
            console.log(v.address.x, v.address.y);
          });
        }
      },
    );
  }, []);

  return (
    <div>
      <div id="map" style={{ width: '500px', height: '400px' }}></div>
    </div>
  );
};

export default Today;
