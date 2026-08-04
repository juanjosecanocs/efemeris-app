export default function DateCell({ fecha, isSelected, isDisabled, atenuado, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`relative flex aspect-square w-full items-center justify-center rounded-lg text-[13px] font-medium transition-colors duration-200 ${
        isDisabled
          ? 'cursor-not-allowed text-gray-300'
          : isSelected
            ? 'cursor-pointer bg-[#6366f1] font-semibold text-white'
            : `cursor-pointer text-texto hover:bg-[#f0f1ff] ${atenuado ? 'text-texto-secundario' : ''}`
      }`}
    >
      {fecha.getDate()}
      {isSelected && <span className="absolute right-0.5 top-0.5 text-[9px] leading-none">✓</span>}
    </button>
  )
}
