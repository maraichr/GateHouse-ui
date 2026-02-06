import { ComponentTree } from '../types';

export async function fetchSpec(): Promise<ComponentTree> {
  const res = await fetch('/_renderer/spec');
  if (!res.ok) {
    throw new Error(`Failed to fetch spec: ${res.status}`);
  }
  return res.json();
}
