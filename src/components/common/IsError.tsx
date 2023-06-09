import styled from "styled-components";
import Wrapper from "./Wrapper";

const IsError = () => {
    return <Wrapper>
        <StErrorDiv>An Error Has Been Occurred!</StErrorDiv>
    </Wrapper> 
};

export default IsError;

const StErrorDiv = styled.div`
    margin-top : 1rem;
    width : 100%;
    height : 256px;
    display : flex;
    justify-content : center;
    align-items: center;
    font-size : 2rem;
    font-family : 'inter';
    font-weight : 300;
    color : #757575;
`