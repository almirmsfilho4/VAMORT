import React from 'react';

/**
 * StitchButton — Material Design 3 styled buttons
 * Variants: filled, tonal, outlined, text, gold, ghost
 * Sizes: sm, md, lg
 */
export function StitchButton({
  children,
  variant = 'filled',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  type = 'button',
  ...props
}) {
  const baseClasses = 'stitch-btn inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 tab-focus';
  
  const variantClasses = {
    filled: 'stitch-btn-filled',
    tonal: 'stitch-btn-tonal',
    outlined: 'stitch-btn-outlined',
    text: 'stitch-btn-text',
    gold: 'stitch-btn-gold',
    ghost: 'stitch-btn-ghost',
  }[variant];

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-3 text-base',
    lg: 'px-7 py-4 text-lg',
  }[size];

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : leftIcon ? (
        <span className="material-symbols-outlined text-lg" aria-hidden="true">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && (
        <span className="material-symbols-outlined text-lg" aria-hidden="true">{rightIcon}</span>
      )}
    </button>
  );
}

/**
 * StitchIconButton — Icon-only button with MD3 styling
 */
export function StitchIconButton({
  icon,
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  className = '',
  size = 'md',
  ...props
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }[size];

  return (
    <button
      className={`stitch-icon-btn ${sizeClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      {...props}
    >
      <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
    </button>
  );
}

/**
 * StitchInput — Text field with MD3 styling
 */
export function StitchInput({
  label,
  error,
  helperText,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  id,
  className = '',
  ...props
}) {
  const inputId = id || `stitch-input-${React.useId()}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText && !error ? `${inputId}-helper` : undefined;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
          {label} {required && <span className="text-[var(--md-sys-color-primary)]" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] material-symbols-outlined" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={errorId || helperId}
          className={`stitch-input ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${error ? 'border-[var(--md-sys-color-error)]' : ''}`}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] material-symbols-outlined" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-[var(--md-sys-color-error)]" role="alert">{error}</p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-sm text-[var(--md-sys-color-on-surface-variant)]">{helperText}</p>
      )}
    </div>
  );
}

/**
 * StitchSelect — Select dropdown with MD3 styling
 */
export function StitchSelect({
  label,
  error,
  helperText,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder,
  required = false,
  disabled = false,
  fullWidth = true,
  id,
  className = '',
  ...props
}) {
  const selectId = id || `stitch-select-${React.useId()}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const helperId = helperText && !error ? `${selectId}-helper` : undefined;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
          {label} {required && <span className="text-[var(--md-sys-color-primary)]" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={errorId || helperId}
        className={`stitch-select ${error ? 'border-[var(--md-sys-color-error)]' : ''}`}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-[var(--md-sys-color-error)]" role="alert">{error}</p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-sm text-[var(--md-sys-color-on-surface-variant)]">{helperText}</p>
      )}
    </div>
  );
}

/**
 * StitchTextField — Textarea field with MD3 styling (multiline support)
 */
export function StitchTextField({
  label,
  error,
  helperText,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows = 3,
  id,
  className = '',
  ...props
}) {
  const inputId = id || `stitch-textfield-${React.useId()}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText && !error ? `${inputId}-helper` : undefined;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
          {label} {required && <span className="text-[var(--md-sys-color-primary)]" aria-hidden="true">*</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          id={inputId}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={errorId || helperId}
          rows={rows}
          className={`stitch-input ${error ? 'border-[var(--md-sys-color-error)]' : ''} resize-y min-h-[80px]`}
          {...props}
        />
      ) : (
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={errorId || helperId}
          className={`stitch-input ${error ? 'border-[var(--md-sys-color-error)]' : ''}`}
          {...props}
        />
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-[var(--md-sys-color-error)]" role="alert">{error}</p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-sm text-[var(--md-sys-color-on-surface-variant)]">{helperText}</p>
      )}
    </div>
  );
}

/**
 * StitchBadge — Badge/chip component
 */
export function StitchBadge({
  children,
  variant = 'surface',
  icon,
  className = '',
  ...props
}) {
  const variantClasses = {
    primary: 'stitch-badge-primary',
    secondary: 'stitch-badge-secondary',
    tertiary: 'stitch-badge-tertiary',
    error: 'stitch-badge-error',
    surface: 'stitch-badge-surface',
  }[variant];

  return (
    <span className={`stitch-badge ${variantClasses} ${className}`} {...props}>
      {icon && <span className="material-symbols-outlined text-xs" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

/**
 * StitchProgress — Progress bar with MD3 styling
 */
export function StitchProgress({
  value = 0,
  max = 100,
  variant = 'primary',
  showLabel = false,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const variantClass = variant === 'gold' ? 'stitch-progress-gold' : '';

  return (
    <div className={`stitch-progress ${variantClass} ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={ariaLabel} {...props}>
      <div className="stitch-progress-bar" style={{ width: `${percentage}%` }} />
    </div>
  );
}

/**
 * StitchAvatar — Avatar component
 */
export function StitchAvatar({
  src,
  alt,
  name,
  size = 'md',
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'stitch-avatar',
    md: 'stitch-avatar',
    lg: 'stitch-avatar-lg',
    xl: 'stitch-avatar-xl',
  }[size];

  const fontSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-3xl',
  }[size];

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className={`stitch-avatar ${sizeClasses} ${className}`} role="img" aria-label={alt || name || 'Avatar'} {...props}>
      {src ? (
        <img src={src} alt={alt || ''} className="w-full h-full object-cover" />
      ) : (
        <span className={fontSizes} aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}

/**
 * StitchCard — Card container with MD3 styling
 */
export function StitchCard({
  children,
  variant = 'elevated',
  hover = true,
  className = '',
  onClick,
  ...props
}) {
  const variantClasses = {
    elevated: 'stitch-card-elevated',
    filled: 'stitch-card-filled',
    outlined: 'stitch-card',
  }[variant];

  const hoverClass = hover && onClick ? 'cursor-pointer' : '';

  return (
    <article className={`${variantClasses} ${hoverClass} ${className}`} onClick={onClick} {...props}>
      {children}
    </article>
  );
}

/**
 * StitchTabs — Tab navigation
 */
export function StitchTabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  ...props
}) {
  return (
    <nav className={`stitch-tabs ${className}`} role="tablist" aria-label="Tabs" {...props}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          id={`${tab.id}-tab`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          className={`stitch-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange?.(tab.id)}
        >
          {tab.icon && <span className="material-symbols-outlined mr-1.5" aria-hidden="true">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

/**
 * StitchModal — Modal dialog
 */
export function StitchModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  className = '',
  ...props
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  }[size];

  return (
    <div className="stitch-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={title ? 'stitch-modal-title' : undefined}>
      <div className={`stitch-modal ${sizeClasses} ${className}`} {...props}>
        {(title || showClose) && (
          <div className="flex items-start justify-between gap-4 mb-4">
            {title && (
              <h2 id="stitch-modal-title" className="text-xl font-semibold text-[var(--md-sys-color-on-surface)] font-serif">
                {title}
              </h2>
            )}
            {showClose && (
              <button
                className="stitch-icon-btn"
                onClick={onClose}
                aria-label="Fechar modal"
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/**
 * StitchToggle — Switch/toggle component
 */
export function StitchToggle({
  checked,
  onChange,
  disabled = false,
  label,
  className = '',
  id,
  ...props
}) {
  const toggleId = id || `stitch-toggle-${React.useId()}`;

  return (
    <label className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        className={`stitch-toggle ${checked ? 'active' : ''}`}
        onClick={() => !disabled && onChange?.(!checked)}
        disabled={disabled}
        {...props}
      />
      {label && <span className="text-sm text-[var(--md-sys-color-on-surface)]">{label}</span>}
    </label>
  );
}

/**
 * StitchDivider — Horizontal divider
 */
export function StitchDivider({ variant = 'default', className = '', ...props }) {
  const variantClasses = {
    default: 'stitch-divider',
    gold: 'stitch-divider-gold',
  }[variant];

  return <hr className={`${variantClasses} ${className}`} {...props} />;
}

/**
 * StitchSectionHeader — Section header with icon
 */
export function StitchSectionHeader({
  title,
  icon,
  action,
  className = '',
  ...props
}) {
  return (
    <header className={`stitch-section-header ${className}`} {...props}>
      {icon && (
        <span className="stitch-section-icon material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      )}
      <h3 className="stitch-section-title">{title}</h3>
      {action}
    </header>
  );
}

/**
 * StitchStat — Stat display component
 */
export function StitchStat({
  value,
  label,
  icon,
  variant = 'primary',
  className = '',
  ...props
}) {
  const valueClass = variant === 'gold' ? 'text-[var(--md-sys-color-secondary)]' : 'stitch-stat-value';

  return (
    <div className={`stitch-stat ${className}`} {...props}>
      {icon && (
        <span className="material-symbols-outlined text-lg text-[var(--md-sys-color-on-surface-variant)]" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={`${valueClass} font-mono`}>{value}</span>
      <span className="stitch-stat-label">{label}</span>
    </div>
  );
}

/**
 * StitchListItem — List item component
 */
export function StitchListItem({
  children,
  leading,
  trailing,
  onClick,
  className = '',
  ...props
}) {
  const Component = onClick ? 'button' : 'div';
  const clickClass = onClick ? 'cursor-pointer' : '';

  return (
    <Component className={`stitch-list-item ${clickClass} ${className}`} onClick={onClick} {...props}>
      {leading && <span className="flex-shrink-0">{leading}</span>}
      <div className="flex-1 min-w-0">{children}</div>
      {trailing && <span className="flex-shrink-0">{trailing}</span>}
    </Component>
  );
}

/**
 * StitchFloatingNumber — Floating damage/heal numbers
 */
export function StitchFloatingNumber({
  value,
  type = 'damage', // damage, heal, buff
  className = '',
  ...props
}) {
  const typeClass = `stitch-floating-number ${type}`;

  return (
    <span className={`${typeClass} ${className}`} {...props} aria-hidden="true">
      {type === 'heal' ? '+' : ''}{value}
    </span>
  );
}

/**
 * StitchHeroPanel — Hero panel with background image
 */
export function StitchHeroPanel({
  children,
  image,
  imageAlt,
  className = '',
  ...props
}) {
  return (
    <section className={`stitch-hero-panel ${className}`} {...props}>
      {image && (
        <img
          src={image}
          alt={imageAlt || ''}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          aria-hidden="true"
        />
      )}
      <div className="relative z-10 p-6 md:p-8">{children}</div>
    </section>
  );
}

/**
 * StitchMinionView — Minion card for battlefield
 */
export function StitchMinionView({
  minion,
  canAttack = false,
  onClick,
  className = '',
  ...props
}) {
  const { attack, health, maxHealth, keywords = [], name, art } = minion;

  return (
    <article
      className={`stitch-minion ${canAttack ? 'can-attack' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {art && (
        <img src={art} alt="" className="w-full aspect-square object-cover rounded-t-md" aria-hidden="true" />
      )}
      <div className="p-3 space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-[var(--md-sys-color-on-surface)] truncate pr-2">{name}</h4>
          <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
            {attack}/{health}
          </span>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {keywords.map((kw) => (
              <StitchBadge key={kw} variant="surface" size="sm">{kw}</StitchBadge>
            ))}
          </div>
        )}
        <StitchProgress value={health} max={maxHealth} className="h-1.5" />
      </div>
    </article>
  );
}

/**
 * StitchDivider — Section divider with label
 */
export function StitchLabeledDivider({ label, className = '', ...props }) {
  return (
    <div className={`flex items-center gap-4 ${className}`} {...props}>
      <hr className="flex-1 stitch-divider" />
      {label && <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">{label}</span>}
      <hr className="flex-1 stitch-divider" />
    </div>
  );
}

/**
 * StitchGrid — Responsive grid layouts using Stitch CSS utilities
 */
export function StitchGrid({
  children,
  columns = 2,
  gap = 'md',
  className = '',
  ...props
}) {
  const columnClasses = {
    1: 'stitch-grid-1',
    2: 'stitch-grid-2',
    3: 'stitch-grid-3',
    4: 'stitch-grid-4',
    5: 'stitch-grid-5',
  }[columns];

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-1',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }[gap];

  return (
    <div className={`grid ${columnClasses} ${gapClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * StitchScrollArea — Scrollable area with custom scrollbar
 */
export function StitchScrollArea({
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`stitch-scroll ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * StitchCardRelic — Card display for hand/deck (TCG style)
 */
export function StitchCardRelic({
  card,
  onClick,
  disabled = false,
  className = '',
  size = 'md', // sm, md, lg
  showCost = true,
  ...props
}) {
  const { name, cost, attack, health, rarity, faction, type, art, effectSymbol, description } = card;
  const isMinion = type === 'MINION';
  const canPlay = !disabled;

  const sizeClasses = {
    sm: 'w-[110px] p-1.5 sm:w-[120px] sm:p-2',
    md: 'w-[140px] p-2 sm:w-[150px] sm:p-2.5 md:w-[160px] md:p-3',
    lg: 'w-[160px] p-2.5 sm:w-[180px] sm:p-3 md:w-[200px] md:p-4',
  }[size];

  const rarityColors = {
    COMUM: 'var(--md-sys-color-on-surface-variant)',
    RARA: 'var(--md-sys-color-info)',
    EPICA: 'var(--md-sys-color-tertiary)',
    LENDARIA: 'var(--md-sys-color-secondary)',
  };

  const rarityGlow = {
    COMUM: '0 0 0 transparent',
    RARA: '0 0 8px var(--md-sys-color-info)',
    EPICA: '0 0 12px var(--md-sys-color-tertiary)',
    LENDARIA: '0 0 16px var(--md-sys-color-secondary)',
  };

  return (
    <article
      className={`stitch-card-relic ${canPlay ? 'playable' : 'disabled'} ${className}`}
      onClick={onClick}
      style={{ boxShadow: canPlay ? rarityGlow[rarity] || 'var(--elevation-2)' : 'var(--elevation-1)' }}
      {...props}
    >
      {art && (
        <img
          src={art}
          alt=""
          className="w-full aspect-[4/5] object-cover rounded-t-md mb-2"
          aria-hidden="true"
        />
      )}
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="font-serif text-base font-semibold text-[var(--md-sys-color-on-surface)] truncate pr-2">
            {name}
          </h4>
          {showCost && cost !== undefined && (
            <span className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-primary-dark))',
                boxShadow: '0 2px 8px rgba(230,25,75,0.4)',
              }}>
              {cost}
            </span>
          )}
        </div>
        {isMinion && attack !== undefined && health !== undefined && (
          <div className="flex justify-between text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
            <span className="text-[var(--md-sys-color-error)]">⚔ {attack}</span>
            <span className="text-[var(--md-sys-color-success)]">❤ {health}</span>
          </div>
        )}
        {(rarity || faction || type) && (
          <div className="flex gap-1 flex-wrap">
            {rarity && <StitchBadge variant="surface" size="sm">{rarity}</StitchBadge>}
            {faction && <StitchBadge variant="surface" size="sm">{faction}</StitchBadge>}
          </div>
        )}
        {effectSymbol && (
          <div className="text-lg animate-pulse">{effectSymbol}</div>
        )}
      </div>
    </article>
  );
}

/**
 * StitchTooltip — Simple tooltip component
 */
export function StitchTooltip({ label, children, position = 'top', className = '' }) {
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef(null);
  const childRef = useRef(null);

  useEffect(() => {
    const child = childRef.current;
    if (!child) return;
    const show = () => setVisible(true);
    const hide = () => setVisible(false);
    child.addEventListener('mouseenter', show);
    child.addEventListener('mouseleave', hide);
    child.addEventListener('focus', show);
    child.addEventListener('blur', hide);
    return () => {
      child.removeEventListener('mouseenter', show);
      child.removeEventListener('mouseleave', hide);
      child.removeEventListener('focus', show);
      child.removeEventListener('blur', hide);
    };
  }, []);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span ref={childRef} className="inline-block" tabIndex={0}>
      {children}
      {visible && label && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-2 py-1 text-xs font-medium text-[var(--md-sys-color-on-surface)] bg-[var(--md-sys-color-inverse-surface)] rounded shadow-lg animate-fade-in ${positions[position]} ${className}`}
          role="tooltip"
        >
          {label}
          <div className={`absolute ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2' : position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2' : position === 'left' ? 'left-full top-1/2 -translate-y-1/2' : 'right-full top-1/2 -translate-y-1/2'} w-0 h-0 border-4 border-transparent`} 
               style={{ 
                 borderColor: position === 'top' ? 'var(--md-sys-color-inverse-surface) transparent transparent' : 
                            position === 'bottom' ? 'transparent transparent var(--md-sys-color-inverse-surface)' :
                            position === 'left' ? 'transparent transparent transparent var(--md-sys-color-inverse-surface)' :
                            'transparent var(--md-sys-color-inverse-surface) transparent transparent' 
               }} />
        </div>
      )}
    </span>
  );
}