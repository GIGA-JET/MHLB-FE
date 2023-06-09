import { useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { getWorkspaceList } from "../../api/workspace";
import { reorderWorkspaceList } from "../../api/workspace";
import { getCookie } from "../../cookie/cookies";
import { useSelector } from "react-redux";
import { getChatList } from "../../api/rightSide";
import LeftSideIcon from "./LeftSideIcon";

export interface WorkspaceListIconType {
    unreadMessages : number,
    unreadMessage : boolean,
    workspaceId : number,
    workspaceImage : string,
    workspaceTitle : string,
    workspaceDesc : string
}

const LeftSideBar = ({setChatListProps} : {setChatListProps : any}) => {

    const [workspaceList, setWorkspaceList] = useState<any>([]);

    const stompClient = useSelector((state : any) => state.websocket.stompClient);

    const params = useParams();
    const userId = getCookie('userId');
    const navigate = useNavigate();

    const [chatListData, setChatListData] = useState<any>([]);
    const [subscribeData, setSubscribeData] = useState<any>({});

    useEffect(() => {
        if(userId && !(Object.keys(stompClient).length === 0)) {
            stompClient.subscribe(`/sub/unread-message/${userId}`, (data : any) => {
                setSubscribeData(JSON.parse(data.body));
            });
        }
        return () => {
            if (stompClient && stompClient.connected) {
                stompClient.unsubscribe(`/sub/unread-message/${userId}`);
            }
        }
    }, [userId, stompClient]);

    useEffect(() => {
        getWorkspaceList()
        .then((res) => {
            setWorkspaceList(res.data);
        })
        getChatList(Number(params.workspaceId))
        .then((res) => {
            setChatListProps(res);
            setChatListData(res);
        })
    }, [])

    useEffect(() => {
        alarmBadgeHandler(subscribeData);
    }, [subscribeData])

    const alarmBadgeHandler = (data : any) => {
        const tmpWorkspaceList = [...workspaceList.map((val : any) => val.workspaceId === Number(data.workspaceId) ? {...val, unreadMessage : data?.unreadMessage} : val)];
        setWorkspaceList(tmpWorkspaceList);

        if (Object.keys(data).length > 3 && (chatListData.filter((val : any) => val.uuid === data.uuid).length === 1)) {
            const tmpChatListData = [...chatListData.map((val : any) => (Number(params.workspaceId) === Number(data.workspaceId) && Number(val.userId) === Number(data.senderId)) ? {...val, unreadMessages : val.unreadMessages + 1, message : data.lastMessage} : val)]
            setChatListData(tmpChatListData);
            setChatListProps(tmpChatListData);
        } else if (Object.keys(data).length > 3) {
            const tmpChatListData = [{lastChat : data.lastChat, message : data.lastMessage, unreadMessages : 1, userId : data.senderId, userImage : data.senderImage, userName : data.senderName, uuid : data.uuid}, ...chatListData]
            setChatListData(tmpChatListData);
            setChatListProps(tmpChatListData);
        } else if (Object.keys(data).length === 3) {
            const tmpChatListData = [...chatListData.map((val : any) => (Number(params.workspaceId) === Number(data.workspaceId) && (val.uuid === data.uuid)) ? {...val, unreadMessages : 0} : val)]
            setChatListData(tmpChatListData);
            setChatListProps(tmpChatListData);
        }
    }

    useEffect(() => {
        const orderList = ({ orders : [...workspaceList.map((val : WorkspaceListIconType, idx : number) => {
            return {workspaceId : Number(val.workspaceId), orderNum : Number(idx)};
        })]})
        reorderWorkspaceList({...orderList})
    }, [workspaceList])

    const handleOnDragEnd = (result : any) => {
        if (!result.destination) return;
        const tempArr = [...workspaceList];
        const [removedArr] = tempArr.splice(result.source.index, 1);
        tempArr.splice(result.destination.index, 0, removedArr);
        setWorkspaceList(tempArr);
    }

    return (
        <DragDropContext onDragEnd = {(result) => {handleOnDragEnd(result)}}>
            <Droppable droppableId = "workspace">
                {(provided) => (
                    <StLeftSideContainer className="workspace" {...provided.droppableProps} ref={provided.innerRef}>
                        {workspaceList?.map((obj : WorkspaceListIconType, index : number) => {
                            return (
                                <Draggable key = {String(obj.workspaceId)} draggableId = {String(obj.workspaceId)} index = {index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                            <LeftSideIcon onClick = {() => {navigate(`/workspace/${obj.workspaceId}`); window.location.reload()}} img = {obj.workspaceImage} obj = {obj}>
                                                {obj.unreadMessage ? <StAlarm /> : null}
                                            </LeftSideIcon>
                                        </div>
                                    )}
                                </Draggable>
                            )
                        })}
                        {provided.placeholder}
                    </StLeftSideContainer>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default LeftSideBar;

const StLeftSideContainer = styled.div`
    width : 64px;
    height : 100%;
    background-color : white;
    box-shadow : 0px 0px 1rem rgba(0, 0, 0, 0.05);
    display : flex;
    flex-direction : column;
    justify-content : flex-start;
    align-items : center;
    flex-shrink : 0;
    position : fixed;
    padding-top : 64px;
    top : 0;
    left : 0;
    box-sizing : border-box;
    z-index : 4;
    @media screen and (max-width : 672px) {
        display : none;
    }
`

const StAlarm = styled.div`
    width : 12px;
    height : 12px;
    background : #007aff;
    border-radius : 8px;
    outline : 2px solid white;
    position : absolute;
    right : 0;
    bottom : 0;
`