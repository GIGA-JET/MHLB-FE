import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { createWorkspace } from '../../api/selectWorkspace';
import Close from '../asset/icons/Close';
import { GvWorkspaceDescLength, GvWorkspaceNameLength } from '../../global/LimitConfig';
import useInputRefFocus from '../../hooks/useInputRefFocus';
import { logEvent } from '../../util/amplitude';

function CreateWorkspaceModal({modalRef, setCreateModal}: {modalRef: React.MutableRefObject<any>, setCreateModal: (v: boolean) => void}) {
  const imgInputRef = useRef<any>(null);
  const navigate = useNavigate();

  const [image, setImage] = useState<any>('');
  const [imgFile, setImgFile] = useState<any>();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [nameValidation, setNameValidation] = useState(false);
  const [descValidation, setDescValidation] = useState(false);

  const [workspaceTitleInputRef, workspaceTitleInputRefFocus] = useInputRefFocus();
  const [workspaceDescInputRef, workspaceDescInputRefFocus] = useInputRefFocus();

  const onImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if(e.target.files) {
      if(e.target.files[0].size >= 1024 ** 2 * 10){
        alert(`10MB 이하 파일만 등록할 수 있습니다. 
현재 파일 용량: ${Math.round(e.target.files[0].size/1024/1024)}MB` );
        return;
      }
      else setImgFile(e.target.files[0]);
    }
    
    // 업로드한 이미지 표시
    const fileReader = new FileReader();
    if(e.target.files) fileReader.readAsDataURL(e.target.files[0]);
    fileReader.onload = () => {
      setImage(fileReader.result)
    };
  };

  const onClickCreateHandler = (e: any) => {
    if(!name && !desc) {
      setNameValidation(true);
      setDescValidation(true);
      return;
    }
    if(!name){
      setNameValidation(true);
      return;
    };
    if(!desc){
      setDescValidation(true);
      return;
    };
    logEvent('Create workspace button from Modal', {from: 'Select workspace page'});
    const body = {
      workspaceTitle: name,
      workspaceDesc: desc
    };
    const formData = new FormData();
    formData.append("image", imgFile);
    const data = new Blob([JSON.stringify(body)], { type: "application/json" });
    formData.append('data', data);

    createWorkspace(formData)
    .then((res) => {
      navigate(`/workspace/${res.data.workspaceId}`);
    })
    .catch((error) => {
      if(error.response.data.code === 'E-01') {
        alert('이미지 파일이 첨부되지 않았습니다.');
      } else if(error.response.data.code === 'E-02' || error.response.data.code === 'E-04') {
        alert('예상치 못한 오류가 발생했습니다.');
        window.location.reload();
      } else if(error.response.data.code === 'E-03') {
        alert(`이미지 확장자를 변경해 주세요.
가능한 이미지 파일 확장자: .png, .jpg, .jpeg, .gif`);
      } 
    });
    setCreateModal(false);
  };

  const onEnterKeyDownTitle = (e : React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter') {
      workspaceDescInputRef.current.focus();
    }
  }

  const onClickImgUpload = () => {
    imgInputRef.current.click();
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
        document.body.style.overflow = 'auto';
    }
  });

  return (
    <StWrap>
      <StModalContainer ref={modalRef}>
        <StLeaveBtn><Close size="36" fill="#303030" onClick={() => setCreateModal(false)} cursor='pointer' /></StLeaveBtn>
        <StModalTitle>워크스페이스 생성</StModalTitle>
        <StInputLabel isFocus = {false}>워크스페이스 이미지</StInputLabel>
        <StImgUploadBox>
          <StMypageProfileEdit onClick={onClickImgUpload}><StMypageProfileEditText>이미지 선택</StMypageProfileEditText></StMypageProfileEdit>
          <StImage img = {image === '' ? 'https://mhlbbucket.s3.ap-northeast-2.amazonaws.com/default/03f54651-8d39-4cc1-86b4-292040a71e12-DefaultWorkspaceImage.png' : image} />
          <StImageInput type="file" name="creageWorkspaceImg" ref={imgInputRef} onChange={onImgChange} accept='image/png, image/jpg, image/jpeg, image/gif' />
        </StImgUploadBox>
        <StInputLabel htmlFor = 'title' isFocus = {workspaceTitleInputRefFocus}>워크스페이스 이름*</StInputLabel>
        <StTitleInput id = 'title' type="text" value={name} onKeyDown = {onEnterKeyDownTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {setName(e.target.value); setNameValidation(false); setDescValidation(false);}} maxLength={GvWorkspaceNameLength} placeholder = 'Workspace Title (50자 이내)' ref = {workspaceTitleInputRef}/>
        <StValidationTextBox>{nameValidation && <StValidationText>워크스페이스 이름을 입력해 주세요.</StValidationText>}</StValidationTextBox>
        <StInputLabel htmlFor = 'desc' isFocus = {workspaceDescInputRefFocus}>워크스페이스 소개*</StInputLabel>
        <StDescInput id = 'desc' value={desc} onChange={(e:React.ChangeEvent<HTMLTextAreaElement>) => {setDesc(e.target.value); setDescValidation(false); setNameValidation(false)}} maxLength={GvWorkspaceDescLength} placeholder = 'Description of Workspace (200자 이내)' ref = {workspaceDescInputRef}/>
        <StValidationTextBox>{descValidation && <StValidationText>워크스페이스 소개를 입력해주세요.</StValidationText>}</StValidationTextBox>
        <StCreateBtn onClick={onClickCreateHandler}>워크스페이스 생성</StCreateBtn>
      </StModalContainer>
    </StWrap>
  );
}

export default CreateWorkspaceModal;

const StWrap = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  background-color: rgba(0, 0, 0, 0.1);
  z-index : 5;
`;

const StLeaveBtn = styled.div`
  position : absolute;
  top : 32px;
  right : 32px;
`

const StModalContainer = styled.div`
  display : flex;
  flex-direction : column;
  width : 464px;
  z-index : 6;
  position : fixed;
  background-color : white;
  border : none;
  border-radius : 8px;
  padding : 64px;
  box-sizing: border-box;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const StModalTitle = styled.div`
  font-size : 2rem;
  font-weight : 900;
`;

const StInputLabel = styled.label`
  margin-top : 36px;
  font-size : 1rem;
  font-weight : 700;
  transition : 200ms;
  color : ${(props : {isFocus : boolean}) => props.isFocus ? "#007aff" : "#303030"};
`;

const StImgUploadBox = styled.div`
  margin-top : 8px;
  width : 100%;
  display : flex;
  justify-content : center;
`;

const StImage = styled.div`
  width: 128px;
  height: 128px;
  border-radius: 50%;
  background-image : url('${(props : {img : string | null}) => props.img}');
  background-size : cover;
  background-position : center;
`;

const StMypageProfileEdit = styled.div`
  width : 128px;
  height : 128px;
  border-radius : 256px;
  position : absolute;
  background : linear-gradient(180deg, rgba(217, 217, 217, 0) 0%, rgba(0, 0, 0, 0.5) 100%);
  opacity : 0%;
  transition : 200ms;
  color : transparent;
  display : flex;
  justify-content : center;
  align-items: flex-end;
  &:hover {
    opacity : 100%;
    cursor : pointer;
  }
`

const StMypageProfileEditText = styled.div`
  font-size : 0.75rem;
  font-weight : 700;
  color : white;
  transition : 200ms;
  opacity : 100%;
  margin-bottom : 1rem;
  &:hover {
    opacity : 100%;
    cursor : pointer;
  }
`

const StImageInput = styled.input`
  display: none;
`;

const StTitleInput = styled.input`
  width : 100%;
  height : 42px;
  margin-top : 8px;
  margin-bottom : 0.5rem;
  border : none;
  outline : 1px solid #dbdbdb;
  outline-offset : -1px;
  border-radius : 0.25rem;
  padding : 1rem;
  box-sizing : border-box;
  font-weight : 400;
  transition : 200ms;
  &:placeholder {
    color : #d0d0d0;
  }
  &:focus {
    color : #007aff;
    outline : 1px solid #007aff;
  }
`;

const StDescInput = styled.textarea`
  resize: none;
  width : 100%;
  height : 96px;
  margin-top : 8px;
  margin-bottom: 0.5rem;
  border : none;
  outline : 1px solid #dbdbdb;
  outline-offset : -1px;
  border-radius : 0.25rem;
  padding : 12px 16px;
  box-sizing : border-box;
  font-weight : 400;
  line-height : 1.5rem;
  transition : 200ms;
  &:placeholder {
    color : #d0d0d0;
  }
  &:focus {
    color : #007aff;
    outline : 1px solid #007aff;
  }
`;

const StCreateBtn = styled.button`
  margin-top : 42px;
  width : 100%;
  height : 35px;
  font-size : 1rem;
  font-weight : 700;
  line-height : 24px;
  text-align: center;
  color : white;
  border : none;
  border-radius : 4px;
  background-color : #007AFF;
  padding : 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition : 200ms;
  flex-shrink : 0;
  &:hover {
      background-color : #479fff;
  }
  &:active {
      scale : 1.05;
  }
`;

const StValidationTextBox = styled.div`
  position: relative;
`;
const StValidationText = styled.div`
  font-size : 0.75rem;
  font-weight : 400;
  color : #ff3b30;
  position : absolute; 
  top : 0;
`;