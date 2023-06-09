import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { getMainWorkspaceInfo } from "../api/workspace";
import Wrapper from "../components/common/Wrapper";
import DragDropComp from "../components/workspace/DragDropComp";
import LeftSideBar from "../components/workspace/LeftSideBar";
import RightSideBar from "../components/workspace/RightSideBar";
import { logEvent } from "../util/amplitude";

interface WorkspaceInformationType {
    userRole : string,
    workspaceDesc : string,
    workspaceId : number,      
    workspaceImage : string,
    workspaceTitle : string
}

const Workspace = () => {

    const params = useParams();
    const navigate = useNavigate();

    const [workspaceInfomation, setWorkspaceInfomation] = useState<WorkspaceInformationType | undefined>();
    const [userListData, setUserListData] = useState([]);
    const [userRole, setUserRole] = useState<string>('');
    const [mouseHoverSection, setMouseHoverSection] = useState();
    const [chatListProps, setChatListProps] = useState();

    useEffect(() => {
        getMainWorkspaceInfo({workspaceId : Number(params.workspaceId)})
        .then((res) => {
            setUserRole(res.data.userRole);
            setWorkspaceInfomation(res.data);
            logEvent('Enter App main page', {from: 'Main page'});
        })
        .catch((error) => {
            if(error.response.data.code === 'W-01') {
                alert('워크스페이스가 삭제되었거나 현재 존재하지 않는 워크스페이스입니다.');
                navigate('/select-workspace');
            } else if(error.response.data.code === 'E-11') {
                alert('해당 워크스페이스에 대한 접근 권한이 없습니다.');
                navigate('/select-workspace');
            }
        })
    }, [])

    return (
        <Wrapper>
            <LeftSideBar setChatListProps = {setChatListProps}/>
            <StContainer>
                <StMainContent>
                    <StWorkspaceInfoDiv>
                        <StWorkspaceImage img = {workspaceInfomation?.workspaceImage}/>
                        <StTextInfoDiv>
                            <StWorkspaceTitle>{workspaceInfomation?.workspaceTitle}</StWorkspaceTitle>
                            <StWorkspaceDesc>{workspaceInfomation?.workspaceDesc}</StWorkspaceDesc>
                        </StTextInfoDiv>
                        {(userRole === 'ADMIN' || userRole === 'MANAGER') ? <StConfigPageLinkButton onClick = {() => {logEvent('Workspace config button', {from: 'Main page'}); navigate(`/workspace-config/${workspaceInfomation?.workspaceId}`)}}>관리자 페이지로 이동</StConfigPageLinkButton> : null}
                    </StWorkspaceInfoDiv>
                    <DragDropComp setUserListData = {setUserListData} mouseHoverSection = {mouseHoverSection} />
                </StMainContent>
            </StContainer>
            <RightSideBar userListData = {userListData} setMouseHoverSection = {setMouseHoverSection} chatListProps = {chatListProps} setChatListProps = {setChatListProps}/>
        </Wrapper>
    );
};

export default Workspace;

const StContainer = styled.div`
    display : flex;
    flex-direction : column;
    justify-content : flex-start;
    align-items : center;
    width : 1040px;
    height : 100%;
    box-sizing : border-box;
    padding-top : 64px;
    margin-bottom : 64px;
    background-color : transparent;
`

const StMainContent = styled.div`
    height : 100%;
    width : 100%;
    display : flex;
    flex-direction : column;
    justify-content : flex-start;
    align-items : center;
    transition : 200ms;
    @media screen and (max-width : 1200px) and (min-width : 968px) {
        width : 776px;
    }
    @media screen and (max-width : 968px) {
        width : 512px;
    }
`

const StWorkspaceInfoDiv = styled.div`
    margin-top : 62px;
    margin-bottom : 31px;
    width : 100%;
    display : flex;
    flex-direction : flex-start;
    justify-content : flex-start;
    align-items : center;
`

const StWorkspaceImage = styled.div`
    width : 64px;
    height : 64px;
    background-image : url('${(props : {img : string | undefined}) => props.img}');
    background-size : cover;
    background-position : center;
    border-radius : 64px;
`

const StTextInfoDiv = styled.div`
    margin-left : 16px;
    display : flex;
    flex-direction : column;
    align-items : stretch;
    margin-right : auto;
`

const StWorkspaceTitle = styled.div`
    font-size : 2rem;
    font-weight : 900;
    margin-bottom : 0.25rem;
    color : #303030;
`

const StWorkspaceDesc = styled.div`
    font-size : 1rem;
    font-weight : 300;
    color : #303030;
`

const StConfigPageLinkButton = styled.button`
    font-size : 1rem;
    font-weight : 700;
    line-height : 24px;
    color : white;
    border : none;
    border-radius : 4px;
    background-color : #007AFF;
    padding : 8px 16px;
    transition : 200ms;
    &:hover {
        background-color : #479fff;
    }
    &:active {
        scale : 1.05;
    }
`