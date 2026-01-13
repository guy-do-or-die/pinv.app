import { useState, useEffect } from 'react'
import { useWaitForTransactionReceipt } from 'wagmi'

import { LoaderCircle } from 'lucide-react'
import { Button, ButtonProps } from "../ui/button";

import { notify, hide, parseError } from './Notifications'
import { txLink } from './Utils'

import { useAccount } from '@/components/features/wallet'
import {
    determineTransactionPhase,
    isTransactionLoading,
    shouldDisableTransaction,
    getTransactionButtonText,
    createTransactionExecutor
} from '@/lib/services/transactionService';


interface TxButtonProps {
    simulateHook: any;
    writeHook: any;
    params: any;
    text?: string;
    size?: ButtonProps['size'];
    variant?: ButtonProps['variant'];
    className?: string;
}

function TxButton({ simulateHook, writeHook, params, text, size = "default", variant = "outline", className = "flex-1" }: TxButtonProps) {

    const { address, loggedIn } = useAccount()
    const [triggerCompleted, setTriggerCompleted] = useState(false)
    const [shouldAutoExecute, setShouldAutoExecute] = useState(false)

    const {
        data: simulateData,
        isSuccess: isSimulateSuccess,
        isLoading: isSimulateLoading,
        isError: isSimulateError,
        error: simulateError
    } = simulateHook({
        query: { enabled: params.enabled && loggedIn && (!params.trigger || triggerCompleted) },
        ...params
    })

    const {
        writeContract,
        data: writeData,
        isPending: isWritePending,
        isSuccess: isWriteSuccess,
        isError: isWriteError,
        error: writeError
    } = writeHook({
        query: { enabled: params.enabled && loggedIn && isSimulateSuccess },
        ...params
    })

    const {
        data: confirmationData,
        isError: isConfirmationError,
        isLoading: isConfirmationLoading,
        isSuccess: isConfirmationSuccess,
        error: confirmationError,
    } = useWaitForTransactionReceipt({
        confirmations: 1,
        hash: writeData,
        query: { enabled: loggedIn && params.enabled && writeData },
        ...params,
    })

    useEffect(() => {
        if (isSimulateError) {
            params.onSimulateError?.(simulateError) || notify(parseError(simulateError), 'error')
        }
        if (isSimulateError || isSimulateSuccess) {
            params.simulateCallback?.({ data: simulateData, error: simulateError })
        }
    }, [isSimulateError, isSimulateSuccess])

    useEffect(() => {
        if (isWriteError) {
            params.onWriteError?.(writeError) || notify(parseError(writeError), 'error')
        }
        if (isWriteSuccess) {
            params.onWriteSuccess?.(writeData) ||
                notify(<span>{txLink(writeData, 'Transaction')} sent</span>, 'success', { id: writeData })
        }
        if (isWriteError || isWriteSuccess) {
            params.writeCallback?.({ data: writeData, error: writeError })
        }
    }, [isWriteError, isWriteSuccess])

    useEffect(() => {
        if (isConfirmationError) {
            params.onConfirmationError?.(confirmationError) || notify(parseError(confirmationError), 'error')
            hide('confirming')
        }
        if (isConfirmationSuccess) {
            params.onConfirmationSuccess?.(confirmationData) ||
                notify(<span>{txLink(confirmationData?.transactionHash, 'Transaction')} confirmed</span>, 'success')
            hide('confirming')
        }
        if (isConfirmationError || isConfirmationSuccess) {
            params.confirmationCallback?.({ data: confirmationData, error: confirmationError })
        }
    }, [isConfirmationError, isConfirmationSuccess])

    useEffect(() => {
        if (!isConfirmationLoading && !isConfirmationSuccess && !isConfirmationError) {
            hide('confirming')
        }
    }, [isConfirmationLoading, isConfirmationSuccess, isConfirmationError])

    useEffect(() => {
        if (shouldAutoExecute && isSimulateSuccess && !isWritePending) {
            setShouldAutoExecute(false);

            const executor = createTransactionExecutor({
                writeContract,
                simulateData,
                address
            });

            executor();
        }
    }, [shouldAutoExecute, isSimulateSuccess, isWritePending]);

    useEffect(() => {
        if (params.enabled && isSimulateLoading) {
            notify('Loading', 'loading', { id: 'simulating' })
        } else {
            hide('simulating')
        }
    }, [isSimulateLoading])

    useEffect(() => {
        if (isWritePending) {
            notify('Loading', 'loading', { id: 'writing' })
        } else {
            hide('writing')
        }
        params.pendingCallback?.()
    }, [isWritePending])

    useEffect(() => {
        if (params.enabled && writeData && isConfirmationLoading && !params.trigger) {
            notify(
                <span>Confirming {txLink(writeData, 'Transaction')}</span>,
                'loading',
                { id: 'confirming' }
            )
        }
    }, [isConfirmationLoading, params.enabled, writeData, params.trigger])


    const transactionPhase = determineTransactionPhase({
        isSimulateLoading,
        isSimulateSuccess,
        isSimulateError,
        isWritePending,
        isWriteSuccess,
        isWriteError,
        isConfirmationLoading,
        isConfirmationSuccess,
        isConfirmationError
    });

    const loading = isTransactionLoading(transactionPhase);
    const disabled = shouldDisableTransaction({
        loggedIn,
        enabled: params?.enabled,
        simulateData,
        phase: transactionPhase,
        trigger: params?.trigger
    });

    // Debug TxButton state
    console.log('TxButton Debug - loggedIn:', loggedIn);
    console.log('TxButton Debug - enabled:', params?.enabled);
    console.log('TxButton Debug - hasSimulateData:', !!simulateData);
    console.log('TxButton Debug - hasSimulateRequest:', !!simulateData?.request);
    console.log('TxButton Debug - simulateData:', simulateData);
    console.log('TxButton Debug - isSimulateLoading:', isSimulateLoading);
    console.log('TxButton Debug - isSimulateSuccess:', isSimulateSuccess);
    console.log('TxButton Debug - isSimulateError:', isSimulateError);
    console.log('TxButton Debug - simulateError:', simulateError);
    console.log('TxButton Debug - transactionPhase:', transactionPhase);
    console.log('TxButton Debug - disabled:', disabled);
    console.log('TxButton Debug - text:', text);

    const buttonText = getTransactionButtonText(transactionPhase, text);
    // Enhanced onClick handler that supports triggers
    const onClick = async () => {
        try {
            // Step 1: Run trigger if provided and not yet completed
            if (params.trigger && !triggerCompleted) {
                const shouldProceed = await params.trigger();
                if (shouldProceed === false) {
                    return; // Stop execution if trigger returns false
                }

                // Mark trigger as completed to enable simulation and auto-execute
                setTriggerCompleted(true);
                setShouldAutoExecute(true);
                notify('Preparing transaction...', 'info');
                return; // Let the component re-render and simulate
            }

            // Step 2: Execute transaction (simulation should be complete by now)
            const executor = createTransactionExecutor({
                writeContract,
                simulateData,
                address
            });

            return executor();
        } catch (error) {
            console.error('Transaction error:', error);
            notify('Transaction failed. Please try again.', 'error');
        }
    };

    return (
        <Button variant={variant} size={size} className={className} onClick={onClick} disabled={disabled}>
            {loading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {buttonText}
        </Button>
    )
}

export default TxButton;