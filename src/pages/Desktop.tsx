import Content from 'components/Content';
import Dock from 'components/Dock';
import Header from 'components/Header';
import React, { FC } from 'react';

const Desktop: FC = () => {
  return (
    <>
      <Header />
      <Content />
      <Dock />
    </>
  );
};

export default Desktop;
