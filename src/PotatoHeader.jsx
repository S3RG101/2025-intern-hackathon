import React, { useState } from 'react';
import Timer from './timer';

function PotatoHeader({ characterSrc, objectDetectionBanner }) {
  return (
    <header
      className="App-header"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL + '/updatedbackground.png'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'transparent',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'calc(10px + 2vmin)',
        color: 'white',
        position: 'relative',
      }}
    >
      {/* Object detection banner above timer */}
      {objectDetectionBanner && (
        <div style={{ marginBottom: '16px', zIndex: 100 }}>{objectDetectionBanner}</div>
      )}
      <Timer characterSrc={characterSrc} />
    </header>
  );
}

export default PotatoHeader;
