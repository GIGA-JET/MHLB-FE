import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { getChatList, getPrevMessages, getUuid } from "../../api/rightSide";
import { getCookie } from "../../cookie/cookies";
import ArrowBack from "../asset/icons/ArrowBack";
import { useSelector } from "react-redux";
import { logEvent } from "../../util/amplitude";
import { useNavigate } from "react-router-dom";

interface MessagesType {
  messageId: number,
  userId: number,
  message: string,
  createdAt: string,
};

function Chat({userId, uuid, checkPersonInbox, workspaceId, userName, userImage, userJob, setToggle, setIsChat, setChatListProps}:{userId:number|undefined, uuid:string; checkPersonInbox:boolean; userName:string; userJob:string; userImage:string; workspaceId:number, setChatListProps:any, setToggle:(v:boolean)=>void; setIsChat:(v:boolean)=>void}) {

  const [personBoxUuid, setPersonBoxUuid] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const userIdCookie = { userId : getCookie('userId') };
  const stompClient = useSelector((state : any) => state.websocket.stompClient);

  const [messages, setMessages] = useState<MessagesType[]>([]); 
  const [prevMessages, setPrevMessages] = useState<MessagesType[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [websocketConnected, setWebsocketConnected] = useState(false);

  const [scrollIndex, setScrollIndex] = useState(-1);
  const target = useRef<HTMLDivElement>(null);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);
  const [isLastMessage, setIsLastMessage] = useState(false);

  const navigate = useNavigate()

  useEffect(() => {
    return (() => {
      getChatList(Number(workspaceId))
      .then((res) => {
          setChatListProps(res);
      })
      .catch((error) => {
        if(error.response.data.code === 'W-01') {
          alert('워크스페이스가 삭제되었거나 존재하지 않는 워크스페이스입니다.');
          navigate('/select-workspace');
        }
        
      })
    })
  }, [])

  useEffect(()=>{
    if(checkPersonInbox) {
      getUuid(Number(workspaceId), Number(userId))
      .then((res)=>{
        setPersonBoxUuid(res);
      });
    } else {
      if(uuid) setPersonBoxUuid(uuid);
    }
  },[checkPersonInbox]);
  
  useEffect(()=>{
    if(!(personBoxUuid && !(Object.keys(stompClient).length === 0))) return;
        setWebsocketConnected(true);
        const tmpSub = stompClient.subscribe(`/sub/inbox/${personBoxUuid}`, (data : any) => {
          const messageData = JSON.parse(data.body);
          if(!messageData) setWebsocketConnected(false);
          else setMessages((prev:any) => [...prev, messageData]);
          logEvent('Subscrip Chat room', {from: 'Main page right side bar Inbox'});
        }, userIdCookie);

    return () => {
      if (!(Object.keys(stompClient).length === 0)) {
        // stompClient.unsubscribe(`/sub/inbox/${personBoxUuid}`);
        tmpSub.unsubscribe({destination : `/sub/inbox/${personBoxUuid}`});
      }
    }
  }, [personBoxUuid, stompClient]);

  const scrollToBottom = () => {
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  const onSubmitHandler =  () => {
    setInputMessage('');
    const tmp = inputMessage.replaceAll(' ','');
    if(inputMessage === '\n' || tmp === '') return;
    const sendData = {
      uuid: personBoxUuid,
      message: inputMessage,
      workspaceId,
    };
    if(inputMessage && websocketConnected) {
      stompClient.send(`/pub/inbox`, userIdCookie, JSON.stringify(sendData));
      logEvent('Send message button', {from: 'Main page Chat room'});
    };

  };

  // 무한스크롤
  const callback = (entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if(target.isIntersecting) setScrollIndex(prev => prev + 1);
  };
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 1.0
  };

  useEffect(()=>{
    if(!isLastMessage){
      const observer = new IntersectionObserver(callback, options);
      if(target.current) observer.observe(target.current);
      return () => {
        if(target.current) observer.unobserve(target.current);
      }
    }
  }, [target, isLastMessage]);

  useEffect(() => {
    if(scrollIndex === -1) return;
    if(scrollRef.current?.scrollHeight) setPrevScrollHeight(scrollRef.current.scrollHeight);
    if(!isLastMessage) {
      getPrevMessages(workspaceId, Number(userId), scrollIndex)
      .then((res) => {
        if(res.length === 0) {
          setIsLastMessage(true);
          return;
        }
        setPrevMessages((prev:MessagesType[]) => [...res, ...prev]);
      })
      .catch((error) => {
        if(error.response.data.code === 'W-01'){
          alert('워크스페이스가 삭제되었거나 존재하지 않는 워크스페이스입니다.');
          navigate('/select-workspace');
        }
      });
    }
  }, [scrollIndex]);

  useEffect(() => {
    if(scrollIndex === 0) scrollToBottom(); // 처음 채팅방에 입장시 scroll to bottom
    if(scrollRef.current?.scrollHeight) scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeight;
  },[prevMessages]);

  useEffect(() => {
    scrollToBottom(); // message 입력시 scroll to bottom
  }, [messages]);

  const onKeyPressHandler = (e:React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter') {
      onSubmitHandler();
    }
  };

  const onClickBackBtnHandler = () => {
    setIsChat(false);
    setToggle(true);
  };

  return (
    <StContainer>
      <StBackBtn onClick={onClickBackBtnHandler}>
        <ArrowBack size="16" fill="#ffffff" cursor="pointer" />
        <h3>채팅 목록으로 돌아가기</h3>
      </StBackBtn>
      <StUserData>
        <StLeftBox>
          <StUserImage src={userImage} />
          <StNameJobBox>
            <StUserName>{userName}</StUserName>
            <StUserJob>{userJob}</StUserJob>
          </StNameJobBox>
        </StLeftBox>
      </StUserData>
      <StChatBox ref={scrollRef}>
        <div ref={target} style={{position: "absolute", top: '256px'}}></div>
        {
          prevMessages?.map((item:MessagesType) => {
            return (
              <StMessagesBox key={item.messageId}>
                {
                  item.userId === userId 
                  ? 
                  <StMessages flexDirection="row">
                    <StMessagesOther>{item.message}</StMessagesOther>
                    <StMessagesOtherTime>{item.createdAt.split(':')[0].split('T')[1]+':'+item.createdAt.split('T')[1].split(':')[1]}</StMessagesOtherTime>
                  </StMessages>
                  : 
                  <StMessages flexDirection="row-reverse">
                    <StMessagesMine>{item.message}</StMessagesMine>
                    <StMessagesMineTime>{item.createdAt.split(':')[0].split('T')[1]+':'+item.createdAt.split('T')[1].split(':')[1]}</StMessagesMineTime>
                  </StMessages>
                }
              </StMessagesBox>
            )
          })
        }
        {
          messages?.map((item:MessagesType)=>{
            return (
              <StMessagesBox key={item.messageId}>
              {
                item.userId === userId 
                  ? 
                  <StMessages flexDirection="row">
                    <StMessagesOther>{item.message}</StMessagesOther>
                    <StMessagesOtherTime>{item.createdAt.split(':')[0].split('T')[1]+':'+item.createdAt.split('T')[1].split(':')[1]}</StMessagesOtherTime>
                  </StMessages>
                  : 
                  <StMessages flexDirection="row-reverse">
                    <StMessagesMine>{item.message}</StMessagesMine>
                    <StMessagesMineTime>{item.createdAt.split(':')[0].split('T')[1]+':'+item.createdAt.split('T')[1].split(':')[1]}</StMessagesMineTime>
                  </StMessages>
              }
              </StMessagesBox>
            )
          })
        }
      </StChatBox>
      <StChatInputBox>
        <StChatInput 
          name='inputMessage'
          type="text"
          value={inputMessage} 
          onChange={(e:React.ChangeEvent<HTMLInputElement>)=>{setInputMessage(e.target.value)}} 
          onKeyPress={onKeyPressHandler}
        />
        { websocketConnected
            ? <StSendBtn backgroundColor='#007aff' onClick={onSubmitHandler}>메시지 보내기</StSendBtn>
            : <StSendBtn backgroundColor='#7f7f7f'>메시지 보내기</StSendBtn>}
      </StChatInputBox>
    </StContainer>
  )
};

export default Chat;

const StContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 24px;
  box-sizing: border-box;
`;
const StBackBtn = styled.button`
  display: flex;
  justify-content: center;
  gap: 8px;
  color: #ffffff;
  background-color: #007AFF;
  border:none;
  border-radius: 4px;
  padding: 8px 16px 8px 16px;
  margin: 24px 0 12px 0;
  cursor: pointer;
  h3{
    font-size: 16px;
    font-weight: 500;
  }
`;

const StUserData = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f1f1;
  padding-top: 16px;
  box-sizing: border-box;
`;
const StLeftBox = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;
const StUserImage = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
`;
const StNameJobBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
const StUserName = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #303030;
`;
const StUserJob = styled.h3`
  font-size: 12px;
  font-weight: 400;
  color: #7f7f7f;
`;

const StChatBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height : 100%;
  overflow-y: auto;
  overflow-x: hidden;
  &::-webkit-scrollbar {
    /* display: none; */
  }
  -ms-overflow-style: none; 
  scrollbar-width: none;
  position: relative;
`;
const StMessagesBox = styled.div`
`;
const StMessages = styled.div<{flexDirection:string}>`
  display: flex;
  flex-direction: ${props=>props.flexDirection};
  align-items: flex-end;
`;
const StMessagesOther = styled.div`
  font-size: 0.75rem;
  display: flex;
  background-color: #f3f3f3;
  padding: 8px;
  color: #303030;
  border-radius: 4px;
  margin-right: 4px;
  line-height: 18px;
`;
const StMessagesMine = styled.div`
  font-size: 0.75rem;
  display: flex;
  background-color: #007aff;
  padding: 8px;
  color: #ffffff;
  border-radius: 4px;
  margin-left: 4px;
  line-height: 18px;
`;
const StMessagesOtherTime = styled.div`
  font-size: 9px;
  color: #7f7f7f;
`;
const StMessagesMineTime = styled.div`
  font-size: 9px;
  color: #7f7f7f;
`;

const StChatInputBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  height: 14%;
  padding-bottom: 16px;
  box-sizing: border-box;
`;
const StChatInput = styled.input`
  width: 100%;
  height: 32px;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #dbdbdb;
  resize: none;
  border-radius: 4px;
  :focus{
    outline: none;
    border: 1px solid #007aff;
    color: #007aff;
  }
  &::-webkit-scrollbar {
    display: none;
  }
`;
const StSendBtn = styled.button<{backgroundColor:string}>`
  width: 100%;
  height: 32px;
  background-color: ${props => props.backgroundColor};
  border: none;
  border-radius: 4px;
  color: #ffffff;
`;
