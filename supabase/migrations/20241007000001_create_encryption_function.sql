-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a wrapper function for encryption that's accessible via RPC
CREATE OR REPLACE FUNCTION encrypt_token(token TEXT, key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(token, key), 'base64');
END;
$$;

-- Create a wrapper function for decryption that's accessible via RPC
CREATE OR REPLACE FUNCTION decrypt_token(encrypted_token TEXT, key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted_token, 'base64'), key);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION encrypt_token(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION decrypt_token(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION encrypt_token(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_token(TEXT, TEXT) TO authenticated;
