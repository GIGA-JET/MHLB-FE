import styled from "styled-components";

const Wrapper = ({ children }: { children: any }) => {
  return <StWrapper>{children}</StWrapper>;
};

export default Wrapper;

const StWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  position: relative;
`;
