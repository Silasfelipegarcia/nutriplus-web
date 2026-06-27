export function localizeAuthErrorMessage(message: string): string {
  const exact: Record<string, string> = {
    'E-mail já cadastrado': 'Este e-mail já está cadastrado.',
    'CPF já cadastrado': 'Este CPF já está cadastrado.',
    'CPF inválido': 'CPF inválido.',
    'Email already registered': 'Este e-mail já está cadastrado.',
  };
  return exact[message.trim()] ?? message;
}
