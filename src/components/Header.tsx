import React, { FC } from 'react';
import styled from 'styled-components';

const StyledHeader = styled.div`
  width: 100%;
  background-color: purple;
  color: aliceblue;
  margin-top: 0;
  height: 30px;
`;

const Header: FC = () => {
  return <StyledHeader>Header</StyledHeader>;
};

export default Header;
