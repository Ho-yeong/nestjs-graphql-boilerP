export enum UserRole {
  Admin = 'Admin',
  Member = 'Member',
}

export enum UserTeamRole {
  Member = 'Member',
  Leader = 'Leader',
}

export enum UserTeam {
  CEO = 'CEO',
  PD = 'PD',
  AD = 'AD',
  TD = 'TD',
  Server = 'Server',
  Client = 'Client',
  Plan = 'Plan',
  Background = 'Background',
  CharacterDrawing = 'CharacterDrawing',
  CharacterModeling = 'CharacterModeling',
  Animation = 'Animation',
  UI = 'UI',
  Effect = 'Effect',
  FinancialSupport = 'FinancialSupport',
  LQA = 'LQA',
  QA = 'QA',
  PM = 'PM',
  PersonnelManagement = 'PersonnelManagement',
  Marketing = 'Marketing',
  CS = 'CS',
}

export const TeamMapping: { [key: string]: string } = {
  AD: 'AD',
  Animation: '애니',
  Background: '배경',
  CEO: 'CEO',
  CharacterDrawing: '캐릭원화',
  CharacterModeling: '캐릭모델',
  Client: '클라',
  Effect: '이펙트',
  FinancialSupport: '경영지원',
  LQA: 'LQA',
  PD: 'PD',
  PersonnelManagement: '인사',
  Plan: '기획',
  PM: 'PM',
  QA: 'QA',
  Server: '서버',
  TD: 'TD',
  UI: 'UI',
  Marketing: '마케팅',
  CS: 'CS',
};
