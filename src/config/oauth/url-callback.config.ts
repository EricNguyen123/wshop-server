import { envs } from '../envs';

export const urlCallback = {
  google: (payload: { token: string; email: string }) => {
    const { token, email } = payload;
    return `${envs.feUrl}/en?token=${token}&email=${email}`;
  },
};
