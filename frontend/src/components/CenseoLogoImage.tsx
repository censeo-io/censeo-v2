/**
 * Censeo Logo Component - Image Version
 * Uses the updated PNG logo files
 */

import React from 'react';
import { Box } from '@mui/material';

interface CenseoLogoImageProps {
  width?: number;
  height?: number;
  className?: string;
  showText?: boolean;
}

const CenseoLogoImage: React.FC<CenseoLogoImageProps> = ({
  width = 120,
  height = 144,
  className = '',
  showText = true,
}) => {
  const logoSrc = showText ? '/images/full-logo.png' : '/images/logomark.png';

  return (
    <Box
      className={className}
      sx={{
        width: width,
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={logoSrc}
        alt="Censeo Logo"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
    </Box>
  );
};

export default CenseoLogoImage;