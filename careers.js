(() => {
  const form = document.querySelector('.application-form');
  if (!form) return;

  const role = form.elements.namedItem('Role');
  const subject = form.elements.namedItem('_subject');
  const tools = form.elements.namedItem('Tool familiarity');
  const toolsField = document.getElementById('application-tools-field');
  const toolsOptional = document.getElementById('application-tools-optional');
  const experienceLabel = document.getElementById('application-experience-label');

  function updateRole() {
    const isGtm = role.selectedOptions[0]?.dataset.role === 'gtm';
    toolsField.hidden = !isGtm;
    tools.disabled = !isGtm;
    tools.required = isGtm;
    toolsOptional.hidden = isGtm;
    experienceLabel.textContent = isGtm
      ? 'What sales, marketing, or other relevant experience do you have?'
      : 'What experience or interests would you bring to the role?';
    subject.value = role.value ? `Growency application: ${role.value}` : 'Growency application';
  }

  role.addEventListener('change', updateRole);
  document.querySelectorAll('[data-application-role]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const option = [...role.options].find(item => item.dataset.role === link.dataset.applicationRole);
      if (!option) return;
      role.value = option.value;
      updateRole();
    });
  });
  // Restore the correct fields when returning from the form provider or browser history.
  addEventListener('pageshow', updateRole);
  form.addEventListener('reset', () => requestAnimationFrame(updateRole));
  updateRole();
})();
