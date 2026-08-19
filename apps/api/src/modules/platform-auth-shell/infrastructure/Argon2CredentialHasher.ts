import argon2 from "argon2";
import { CredentialHasher } from "../domain/authTypes.js";

export class Argon2CredentialHasher implements CredentialHasher {
  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
