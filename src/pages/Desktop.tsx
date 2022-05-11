import Content from 'components/Content';
import Dock from 'components/Dock';
import Header from 'components/Header';
import React, { FC } from 'react';
import styled from 'styled-components';

const StyledContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  height: 100vh;
`;

const Desktop: FC = () => {
  return (
    <StyledContainer>
      <Header />
      <Content />
      <Dock />
    </StyledContainer>
  );
};

export default Desktop;
