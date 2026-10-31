// frontend/src/hooks/useAlkherPayPin.js
import { useState, useCallback } from 'react';
import { alkherpayApi } from '../api/alkherpay.api';
import { getErrorMessage } from '../api/axios';
import toast from 'react-hot-toast';

export function useAlkherPayPin() {
  const [hasPin, setHasPin] = useState(null);
  const [linked, setLinked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const data = await alkherpayApi.pinStatus();
      setHasPin(data.hasPin === true);
      setLinked(data.linked !== false);
      return data.hasPin;
    } catch (err) {
      setHasPin(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  const verify = useCallback(async (pin) => {
    setLoading(true);
    setAttemptsRemaining(null);
    setBlockedUntil(null);

    try {
      await alkherpayApi.verifyPin({ pin });
      return { ok: true };
    } catch (err) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error || getErrorMessage(err);

      if (err.response?.data?.blockedUntil) {
        setBlockedUntil(err.response.data.blockedUntil);
      }
      if (err.response?.data?.attemptsRemaining !== undefined) {
        setAttemptsRemaining(err.response.data.attemptsRemaining);
      }

      // Compte non lié
      if (code === 'NO_ALKHERPAY_ACCOUNT') {
        return { ok: false, requiresLink: true, error: msg };
      }

      if (code === 'NO_PIN' || code === 'PIN_NOT_SET') {
        setHasPin(false);
        return { ok: false, needsSetup: true, error: msg };
      }

      if (code === 'PIN_BLOCKED' || err.response?.status === 403) {
        return { ok: false, blocked: true, error: msg };
      }

      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const set = useCallback(async (pin, confirmPin) => {
    setLoading(true);
    try {
      await alkherpayApi.setPin({ pin, confirmPin });
      setHasPin(true);
      toast.success('PIN défini');
      return { ok: true };
    } catch (err) {
      const msg = err.response?.data?.error || getErrorMessage(err);
      toast.error(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setHasPin(null);
    setLinked(true);
    setBlockedUntil(null);
    setAttemptsRemaining(null);
  }, []);

  return {
    hasPin,
    linked,
    loading,
    checking,
    blockedUntil,
    attemptsRemaining,
    checkStatus,
    verify,
    set,
    reset,
  };
}