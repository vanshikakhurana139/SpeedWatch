import React from 'react';
import styled from 'styled-components';
import { SAIL_THEME } from '../styles/theme';
import { TrendingUp, TrendingDown } from 'lucide-react';

const Card = styled.div`
  background: white;
  border-radius: ${SAIL_THEME.borderRadius.lg};
  padding: ${SAIL_THEME.spacing.lg};
  box-shadow: ${SAIL_THEME.shadows.md};
  border: 1px solid ${SAIL_THEME.colors.border};
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${SAIL_THEME.shadows.xl};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${SAIL_THEME.spacing.md};
`;

const IconContainer = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${SAIL_THEME.borderRadius.md};
  background: ${props => props.$color}15;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$color};
`;

const Label = styled.div`
  font-size: ${SAIL_THEME.typography.sizes.sm};
  font-weight: ${SAIL_THEME.typography.weights.semibold};
  color: ${SAIL_THEME.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Value = styled.div`
  font-size: ${SAIL_THEME.typography.sizes['3xl']};
  font-weight: ${SAIL_THEME.typography.weights.bold};
  color: ${SAIL_THEME.colors.textPrimary};
  font-family: ${SAIL_THEME.typography.monoFamily};
  margin: ${SAIL_THEME.spacing.sm} 0;
`;

const ChangeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: ${SAIL_THEME.typography.sizes.sm};
  font-weight: ${SAIL_THEME.typography.weights.semibold};
  color: ${props => props.$trend === 'up' ? SAIL_THEME.colors.success : SAIL_THEME.colors.danger};
`;

const Subtitle = styled.div`
  font-size: ${SAIL_THEME.typography.sizes.xs};
  color: ${SAIL_THEME.colors.textLight};
  margin-top: ${SAIL_THEME.spacing.xs};
`;

export const StatsCard = ({
    icon: Icon,
    label,
    value,
    change,
    trend,
    color = SAIL_THEME.colors.secondary,
    subtitle
}) => {
    return (
        <Card>
            <CardHeader>
                <Label>{label}</Label>
                <IconContainer $color={color}>
                    <Icon size={24} />
                </IconContainer>
            </CardHeader>

            <Value>{value}</Value>

            {change && (
                <ChangeIndicator $trend={trend}>
                    {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {change}% vs yesterday
                </ChangeIndicator>
            )}

            {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </Card>
    );
};