import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { SAIL_THEME } from '../styles/theme';
import { AlertTriangle, Clock, DollarSign, User } from 'lucide-react';

const scroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const TickerContainer = styled.div`
  background: linear-gradient(90deg, ${SAIL_THEME.colors.danger} 0%, #DC2626 100%);
  color: white;
  padding: ${SAIL_THEME.spacing.md};
  overflow: hidden;
  position: relative;
  border-radius: ${SAIL_THEME.borderRadius.lg};
  box-shadow: ${SAIL_THEME.shadows.md};
  border: 1px solid rgba(239, 68, 68, 0.3);
`;

const TickerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${SAIL_THEME.spacing.sm};
  margin-bottom: ${SAIL_THEME.spacing.sm};
  font-size: ${SAIL_THEME.typography.sizes.sm};
  font-weight: ${SAIL_THEME.typography.weights.bold};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const TickerContent = styled.div`
  display: flex;
  animation: ${scroll} 45s linear infinite; // Slowed from 20s to 45s
  gap: ${SAIL_THEME.spacing.xl};
  
  &:hover {
    animation-play-state: paused;
  }
`;

const ViolationItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${SAIL_THEME.spacing.md};
  padding: ${SAIL_THEME.spacing.sm} ${SAIL_THEME.spacing.md};
  background: rgba(255, 255, 255, 0.15);
  border-radius: ${SAIL_THEME.borderRadius.md};
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 350px;
`;

const ViolationDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${SAIL_THEME.typography.sizes.sm};
`;

const ViolationValue = styled.span`
  font-weight: ${SAIL_THEME.typography.weights.bold};
  font-family: ${SAIL_THEME.typography.monoFamily};
`;

const Separator = styled.div`
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.3);
`;

export const ViolationsTicker = ({ violations = [] }) => {
    // Mock violations if none provided
    const mockViolations = violations.length > 0 ? violations : [
        { id: 1, vehicle: 'JH01AB1234', driver: 'Suresh Yadav', speed: 68, penalty: 300, time: '2 mins ago' },
        { id: 2, vehicle: 'JH01CD5678', driver: 'Pranab Das', speed: 72, penalty: 400, time: '5 mins ago' },
        { id: 3, vehicle: 'JH01AB1235', driver: 'Ramesh Gupta', speed: 65, penalty: 200, time: '8 mins ago' },
        { id: 4, vehicle: 'JH01CD5679', driver: 'Sanjay Oraon', speed: 58, penalty: 100, time: '12 mins ago' },
    ];

    // Duplicate for seamless scroll
    const displayViolations = [...mockViolations, ...mockViolations];

    return (
        <TickerContainer>
            <TickerHeader>
                <AlertTriangle size={16} />
                RECENT VIOLATIONS
            </TickerHeader>
            <TickerContent>
                {displayViolations.map((violation, index) => (
                    <ViolationItem key={`${violation.id}-${index}`}>
                        <ViolationDetail>
                            <User size={14} />
                            <ViolationValue>{violation.vehicle}</ViolationValue>
                        </ViolationDetail>

                        <Separator />

                        <ViolationDetail>
                            Driver: <ViolationValue>{violation.driver}</ViolationValue>
                        </ViolationDetail>

                        <Separator />

                        <ViolationDetail>
                            Speed: <ViolationValue style={{ color: SAIL_THEME.colors.accent }}>{violation.speed} km/h</ViolationValue>
                        </ViolationDetail>

                        <Separator />

                        <ViolationDetail>
                            <DollarSign size={14} />
                            <ViolationValue>₹{violation.penalty}</ViolationValue>
                        </ViolationDetail>

                        <Separator />

                        <ViolationDetail>
                            <Clock size={14} />
                            {violation.time}
                        </ViolationDetail>
                    </ViolationItem>
                ))}
            </TickerContent>
        </TickerContainer>
    );
};