import React, { FC } from 'react';
import styled from 'styled-components';

const StyledDockContainer = styled.div`
  display: flex;
  justify-content: center;
  height: 80px;
  background-color: green;
`;

const StyledDock = styled.div`
  margin-top: 10px;
  margin-bottom: 10px;
  width: 70%;
  background-color: yellow;
`;

const Dock: FC = () => {
  return (
    <StyledDockContainer>
      <StyledDock>Dock</StyledDock>
    </StyledDockContainer>
  );
};

export default Dock;
