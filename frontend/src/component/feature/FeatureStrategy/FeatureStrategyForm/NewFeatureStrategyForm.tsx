import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, styled, Tabs, Tab, Box, Divider } from '@mui/material';
import {
    IFeatureStrategy,
    IFeatureStrategyParameters,
    IStrategyParameter,
} from 'interfaces/strategy';
import { FeatureStrategyType } from '../FeatureStrategyType/FeatureStrategyType';
import { FeatureStrategyEnabled } from './FeatureStrategyEnabled/FeatureStrategyEnabled';
import { FeatureStrategyConstraints } from '../FeatureStrategyConstraints/FeatureStrategyConstraints';
import { IFeatureToggle } from 'interfaces/featureToggle';
import useUiConfig from 'hooks/api/getters/useUiConfig/useUiConfig';
import { ConditionallyRender } from 'component/common/ConditionallyRender/ConditionallyRender';
import { STRATEGY_FORM_SUBMIT_ID } from 'utils/testIds';
import { useConstraintsValidation } from 'hooks/api/getters/useConstraintsValidation/useConstraintsValidation';
import PermissionButton from 'component/common/PermissionButton/PermissionButton';
import { FeatureStrategySegment } from 'component/feature/FeatureStrategy/FeatureStrategySegment/FeatureStrategySegment';
import { ISegment } from 'interfaces/segment';
import { IFormErrors } from 'hooks/useFormErrors';
import { validateParameterValue } from 'utils/validateParameterValue';
import { useStrategy } from 'hooks/api/getters/useStrategy/useStrategy';
import { FeatureStrategyChangeRequestAlert } from './FeatureStrategyChangeRequestAlert/FeatureStrategyChangeRequestAlert';
import {
    FeatureStrategyProdGuard,
    useFeatureStrategyProdGuard,
} from '../FeatureStrategyProdGuard/FeatureStrategyProdGuard';
import { formatFeaturePath } from '../FeatureStrategyEdit/FeatureStrategyEdit';
import { useChangeRequestInReviewWarning } from 'hooks/useChangeRequestInReviewWarning';
import { usePendingChangeRequests } from 'hooks/api/getters/usePendingChangeRequests/usePendingChangeRequests';
import { useHasProjectEnvironmentAccess } from 'hooks/useHasAccess';
import { FeatureStrategyTitle } from './FeatureStrategyTitle/FeatureStrategyTitle';
import { FeatureStrategyEnabledDisabled } from './FeatureStrategyEnabledDisabled/FeatureStrategyEnabledDisabled';
import { StrategyVariants } from 'component/feature/StrategyTypes/StrategyVariants';
import { usePlausibleTracker } from 'hooks/usePlausibleTracker';
import { formatStrategyName } from 'utils/strategyNames';

interface IFeatureStrategyFormProps {
    feature: IFeatureToggle;
    projectId: string;
    environmentId: string;
    permission: string;
    onSubmit: () => void;
    onCancel?: () => void;
    loading: boolean;
    isChangeRequest?: boolean;
    strategy: Partial<IFeatureStrategy>;
    setStrategy: React.Dispatch<
        React.SetStateAction<Partial<IFeatureStrategy>>
    >;
    segments: ISegment[];
    setSegments: React.Dispatch<React.SetStateAction<ISegment[]>>;
    errors: IFormErrors;
    tab: number;
    setTab: React.Dispatch<React.SetStateAction<number>>;
}

const StyledDividerContent = styled(Box)(({ theme }) => ({
    padding: theme.spacing(0.75, 1),
    color: theme.palette.text.primary,
    fontSize: theme.fontSizes.smallerBody,
    backgroundColor: theme.palette.background.elevation2,
    borderRadius: theme.shape.borderRadius,
    width: '45px',
    position: 'absolute',
    top: '-10px',
    left: 'calc(50% - 45px)',
    lineHeight: 1,
}));

const StyledForm = styled('form')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(6),
    paddingBottom: theme.spacing(12),
    paddingTop: theme.spacing(4),
    overflow: 'auto',
    height: '100%',
}));

const StyledHr = styled('hr')(({ theme }) => ({
    width: '100%',
    height: '1px',
    margin: theme.spacing(2, 0),
    border: 'none',
    background: theme.palette.background.elevation2,
}));

const StyledTitle = styled('h1')(({ theme }) => ({
    fontWeight: 'normal',
    display: 'flex',
    alignItems: 'center',
}));

const StyledButtons = styled('div')(({ theme }) => ({
    bottom: 0,
    right: 0,
    left: 0,
    position: 'absolute',
    display: 'flex',
    padding: theme.spacing(3),
    paddingRight: theme.spacing(6),
    paddingLeft: theme.spacing(6),
    backgroundColor: theme.palette.common.white,
    justifyContent: 'end',
    borderTop: `1px solid ${theme.palette.divider}`,
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingLeft: theme.spacing(6),
    paddingRight: theme.spacing(6),
}));

const StyledBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    position: 'relative',
    marginTop: theme.spacing(3.5),
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
    width: '100%',
}));

const StyledTargetingHeader = styled('div')(({ theme }) => ({
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1.5),
}));

const StyledHeaderBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    paddingLeft: theme.spacing(6),
    paddingRight: theme.spacing(6),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
}));

export const NewFeatureStrategyForm = ({
    projectId,
    feature,
    environmentId,
    permission,
    onSubmit,
    onCancel,
    loading,
    strategy,
    setStrategy,
    segments,
    setSegments,
    errors,
    isChangeRequest,
    tab,
    setTab,
}: IFeatureStrategyFormProps) => {
    const { trackEvent } = usePlausibleTracker();
    const [showProdGuard, setShowProdGuard] = useState(false);
    const hasValidConstraints = useConstraintsValidation(strategy.constraints);
    const enableProdGuard = useFeatureStrategyProdGuard(feature, environmentId);
    const access = useHasProjectEnvironmentAccess(
        permission,
        projectId,
        environmentId,
    );
    const { strategyDefinition } = useStrategy(strategy?.name);

    const { data } = usePendingChangeRequests(feature.project);
    const { changeRequestInReviewOrApproved, alert } =
        useChangeRequestInReviewWarning(data);

    const hasChangeRequestInReviewForEnvironment =
        changeRequestInReviewOrApproved(environmentId || '');

    const changeRequestButtonText = hasChangeRequestInReviewForEnvironment
        ? 'Add to existing change request'
        : 'Add change to draft';

    const navigate = useNavigate();

    const {
        uiConfig,
        error: uiConfigError,
        loading: uiConfigLoading,
    } = useUiConfig();

    if (uiConfigError) {
        throw uiConfigError;
    }

    if (uiConfigLoading || !strategyDefinition) {
        return null;
    }

    const findParameterDefinition = (name: string): IStrategyParameter => {
        return strategyDefinition.parameters.find((parameterDefinition) => {
            return parameterDefinition.name === name;
        })!;
    };

    const validateParameter = (
        name: string,
        value: IFeatureStrategyParameters[string],
    ): boolean => {
        const parameterValueError = validateParameterValue(
            findParameterDefinition(name),
            value,
        );
        if (parameterValueError) {
            errors.setFormError(name, parameterValueError);
            return false;
        } else {
            errors.removeFormError(name);
            return true;
        }
    };

    const validateAllParameters = (): boolean => {
        return strategyDefinition.parameters
            .map((parameter) => parameter.name)
            .map((name) => validateParameter(name, strategy.parameters?.[name]))
            .every(Boolean);
    };

    const onDefaultCancel = () => {
        navigate(formatFeaturePath(feature.project, feature.name));
    };

    const onSubmitWithValidation = async (event: React.FormEvent) => {
        if (Array.isArray(strategy.variants) && strategy.variants?.length > 0) {
            trackEvent('strategy-variants', {
                props: {
                    eventType: 'submitted',
                },
            });
        }
        event.preventDefault();
        if (!validateAllParameters()) {
            return;
        }

        if (enableProdGuard && !isChangeRequest) {
            setShowProdGuard(true);
        } else {
            onSubmit();
        }
    };

    const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTab(newValue);
    };

    return (
        <>
            <StyledHeaderBox>
                <StyledTitle>
                    {formatStrategyName(strategy.name || '')}
                </StyledTitle>
            </StyledHeaderBox>
            <StyledTabs value={tab} onChange={handleChange}>
                <Tab label='General' />
                <Tab label='Targeting' />
                <Tab label='Variants' />
            </StyledTabs>
            <StyledForm onSubmit={onSubmitWithValidation}>
                <ConditionallyRender
                    condition={tab === 0}
                    show={
                        <>
                            <FeatureStrategyTitle
                                title={strategy.title || ''}
                                setTitle={(title) => {
                                    setStrategy((prev) => ({
                                        ...prev,
                                        title,
                                    }));
                                }}
                            />
                            <FeatureStrategyEnabledDisabled
                                enabled={!strategy?.disabled}
                                onToggleEnabled={() =>
                                    setStrategy((strategyState) => ({
                                        ...strategyState,
                                        disabled: !strategyState.disabled,
                                    }))
                                }
                            />
                            <FeatureStrategyType
                                strategy={strategy}
                                strategyDefinition={strategyDefinition}
                                setStrategy={setStrategy}
                                validateParameter={validateParameter}
                                errors={errors}
                                hasAccess={access}
                            />

                            <ConditionallyRender
                                condition={
                                    hasChangeRequestInReviewForEnvironment
                                }
                                show={alert}
                                elseShow={
                                    <ConditionallyRender
                                        condition={Boolean(isChangeRequest)}
                                        show={
                                            <FeatureStrategyChangeRequestAlert
                                                environment={environmentId}
                                            />
                                        }
                                    />
                                }
                            />

                            <FeatureStrategyEnabled
                                projectId={feature.project}
                                featureId={feature.name}
                                environmentId={environmentId}
                            >
                                <ConditionallyRender
                                    condition={Boolean(isChangeRequest)}
                                    show={
                                        <Alert severity='success'>
                                            This feature toggle is currently
                                            enabled in the{' '}
                                            <strong>{environmentId}</strong>{' '}
                                            environment. Any changes made here
                                            will be available to users as soon
                                            as these changes are approved and
                                            applied.
                                        </Alert>
                                    }
                                    elseShow={
                                        <Alert severity='success'>
                                            This feature toggle is currently
                                            enabled in the{' '}
                                            <strong>{environmentId}</strong>{' '}
                                            environment. Any changes made here
                                            will be available to users as soon
                                            as you hit <strong>save</strong>.
                                        </Alert>
                                    }
                                />
                            </FeatureStrategyEnabled>
                        </>
                    }
                />

                <ConditionallyRender
                    condition={tab === 1}
                    show={
                        <>
                            <StyledTargetingHeader>
                                Segmentation and constraints allow you to set
                                filters on your strategies, so that they will
                                only be evaluated for users and applications
                                that match the specified preconditions.
                            </StyledTargetingHeader>
                            <FeatureStrategySegment
                                segments={segments}
                                setSegments={setSegments}
                                projectId={projectId}
                            />

                            <StyledBox>
                                <StyledDivider />
                                <StyledDividerContent>AND</StyledDividerContent>
                            </StyledBox>
                            <FeatureStrategyConstraints
                                projectId={feature.project}
                                environmentId={environmentId}
                                strategy={strategy}
                                setStrategy={setStrategy}
                            />
                        </>
                    }
                />

                <ConditionallyRender
                    condition={tab === 2}
                    show={
                        <ConditionallyRender
                            condition={
                                strategy.parameters != null &&
                                'stickiness' in strategy.parameters
                            }
                            show={
                                <StrategyVariants
                                    strategy={strategy}
                                    setStrategy={setStrategy}
                                    environment={environmentId}
                                    projectId={projectId}
                                />
                            }
                        />
                    }
                />

                <StyledButtons>
                    <PermissionButton
                        permission={permission}
                        projectId={feature.project}
                        environmentId={environmentId}
                        variant='contained'
                        color='primary'
                        type='submit'
                        disabled={
                            loading ||
                            !hasValidConstraints ||
                            errors.hasFormErrors()
                        }
                        data-testid={STRATEGY_FORM_SUBMIT_ID}
                    >
                        {isChangeRequest
                            ? changeRequestButtonText
                            : 'Save strategy'}
                    </PermissionButton>
                    <Button
                        type='button'
                        color='primary'
                        onClick={onCancel ? onCancel : onDefaultCancel}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <FeatureStrategyProdGuard
                        open={showProdGuard}
                        onClose={() => setShowProdGuard(false)}
                        onClick={onSubmit}
                        loading={loading}
                        label='Save strategy'
                    />
                </StyledButtons>
            </StyledForm>
        </>
    );
};
