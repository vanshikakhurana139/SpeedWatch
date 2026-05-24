import React from 'react';
import styled from 'styled-components';
import { SAIL_THEME } from '../styles/theme';
import { Bell, User, LogOut, Shield } from 'lucide-react';

const HeaderContainer = styled.header`
  background: ${SAIL_THEME.colors.primary};
  color: white;
  padding: 0;
  box-shadow: ${SAIL_THEME.shadows.lg};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${SAIL_THEME.spacing.md} ${SAIL_THEME.spacing.xl};
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${SAIL_THEME.spacing.lg};
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${SAIL_THEME.spacing.md};
`;

const Logo = styled.div`
  width: 56px;
  height: 56px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid ${SAIL_THEME.colors.accent};
  box-shadow: ${SAIL_THEME.shadows.md};
`;

const LogoText = styled.div`
  font-size: 20px;
  font-weight: ${SAIL_THEME.typography.weights.heavy};
  color: ${SAIL_THEME.colors.primary};
  letter-spacing: 2px;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: ${SAIL_THEME.typography.sizes['2xl']};
  font-weight: ${SAIL_THEME.typography.weights.bold};
  margin: 0;
  letter-spacing: 0.5px;
`;

const Subtitle = styled.p`
  font-size: ${SAIL_THEME.typography.sizes.sm};
  margin: 0;
  opacity: 0.85;
  font-weight: ${SAIL_THEME.typography.weights.medium};
`;

const Divider = styled.div`
  width: 2px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${SAIL_THEME.spacing.sm};
  padding: ${SAIL_THEME.spacing.sm} ${SAIL_THEME.spacing.md};
  background: rgba(255, 255, 255, 0.1);
  border-radius: ${SAIL_THEME.borderRadius.md};
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const StatusDot = styled.div`
  width: 10px;
  height: 10px;
  background: ${props => props.$active ? SAIL_THEME.colors.success : SAIL_THEME.colors.danger};
  border-radius: 50%;
  animation: ${props => props.$active ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${SAIL_THEME.spacing.md};
`;

const IconButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: ${SAIL_THEME.borderRadius.md};
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: ${SAIL_THEME.colors.danger};
  border-radius: 50%;
  font-size: 11px;
  font-weight: ${SAIL_THEME.typography.weights.bold};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${SAIL_THEME.colors.primary};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${SAIL_THEME.spacing.md};
  padding: ${SAIL_THEME.spacing.sm} ${SAIL_THEME.spacing.md};
  background: rgba(255, 255, 255, 0.1);
  border-radius: ${SAIL_THEME.borderRadius.md};
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const UserName = styled.div`
  font-size: ${SAIL_THEME.typography.sizes.sm};
  font-weight: ${SAIL_THEME.typography.weights.semibold};
`;

const UserRole = styled.div`
  font-size: ${SAIL_THEME.typography.sizes.xs};
  opacity: 0.85;
`;

const SubHeader = styled.div`
  background: rgba(0, 0, 0, 0.1);
  padding: ${SAIL_THEME.spacing.sm} ${SAIL_THEME.spacing.xl};
  display: flex;
  gap: ${SAIL_THEME.spacing.xl};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const NavItem = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: ${SAIL_THEME.typography.sizes.sm};
  font-weight: ${SAIL_THEME.typography.weights.semibold};
  padding: ${SAIL_THEME.spacing.sm} ${SAIL_THEME.spacing.md};
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  letter-spacing: 0.5px;
  
  &:hover, &.active {
    border-bottom-color: ${SAIL_THEME.colors.accent};
  }
`;

export const Header = ({ user, activeVehicles = 0, onLogout }) => {
    return (
        <HeaderContainer>
            <HeaderContent>
                <LeftSection>
                    <LogoContainer>
                        <Logo>
                            <LogoText>SAIL</LogoText>
                        </Logo>
                        <TitleSection>
                            <Title>SpeedWatch Control Center</Title>
                            <Subtitle>Industrial Vehicle Speed Enforcement • RDCIS Ranchi</Subtitle>
                        </TitleSection>
                    </LogoContainer>

                    <Divider />

                    <StatusBadge>
                        <Shield size={18} />
                        <div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>System Status</div>
                            <div style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <StatusDot $active />
                                ACTIVE
                            </div>
                        </div>
                    </StatusBadge>

                    <StatusBadge>
                        <div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>Active Vehicles</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: SAIL_THEME.typography.monoFamily }}>
                                {activeVehicles}
                            </div>
                        </div>
                    </StatusBadge>
                </LeftSection>

                <RightSection>
                    <IconButton>
                        <Bell size={20} />
                        <NotificationBadge>3</NotificationBadge>
                    </IconButton>

                    <UserInfo>
                        <UserDetails>
                            <UserName>{user?.name || 'Rajesh Kumar'}</UserName>
                            <UserRole>SUPERVISOR</UserRole>
                        </UserDetails>
                        <User size={20} />
                    </UserInfo>

                    <IconButton onClick={onLogout} title="Logout">
                        <LogOut size={20} />
                    </IconButton>
                </RightSection>
            </HeaderContent>

            <SubHeader>
                <NavItem className="active">LIVE MONITORING</NavItem>
                <NavItem>VIOLATIONS</NavItem>
                <NavItem>REPORTS</NavItem>
                <NavItem>ANALYTICS</NavItem>
                <NavItem>SETTINGS</NavItem>
            </SubHeader>
        </HeaderContainer>
    );
};