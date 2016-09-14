/* Generated file based on ejs templates */
define([], function() {
    return {
    "script.bgs.ejs": "import \"constants.bgs\"\nimport \"globals.bgs\"\n# Import user libraries here (if any)\n<%\nif (model.Library_list) {\n  model.Library_list.map(function(library) {\n-%>\nimport \"<%- library.name %>.bgs\"\n<%\n  });\n}\n-%>\n\nconst state_timer_handle = 0\n\ndim changeState\ndim state(64)\n<%\nstates.map(function(state) {\n-%>\ndim <%- state.stateName %>(<%- state.path.length %>)\n<%\n});\n-%>\n\n# The system_boot handler deals with all initialization needed.\nevent system_boot(major, minor, patch, build, ll_version, protocol_version, hw)\n  # user initialization code:\n  #\n  # START USER CODE\n  #\n<%- model.system_boot %>\n  #\n  # END USER CODE\n  #\n  # generated initialization code for the state machine:\n  changeState = 0\n<%\nstates.map(function(state) {\n-%>\n  <%- state.stateName %>(0:<%- state.path.length %>) = \"<%- state.path %>\"\n<%\n});\n-%>\n  # STATE::<%- model.initState.name %>\n  memcpy(state(0), <%- model.initState.stateName %>(0), <%- model.initState.path.length %>)\n  # Start the state timer\n  call hardware_set_soft_timer(<%- parseInt(parseFloat(model.initState.timerPeriod) * 32768.0) %>, state_timer_handle, 0)\nend\n\n# The timer handles all the state function code and state transition\n#  code\nevent hardware_soft_timer(handle)\n  changeState = 0\n  # Generated code to execute state transitions and state functions:\n<%\nif (model.State_list) {\n  model.State_list.map(function(state) {\n-%>\n<%- state.timerFunc %>\n<%\n  });\n}\n-%>\nend\n\n# The interrupt routine handles all conversion from input interrupts\n#  to state variables for state transitions\nevent hardware_io_port_status(timestamp, port, irq, state_io)\n  # user code to handle the interrupts and convert them to state\n  #  variables:\n  #\n  # START USER CODE\n  #\n<%- model.hardware_io_port_status %>\n  #\n  # END USER CODE\n  #\n\n  changeState = 0\n  # Generated code to perform needed state transitions:\n<%\nif (model.State_list) {\n  model.State_list.map(function(state) {\n-%>\n<%- state.irqFunc %>\n<%\n  });\n}\n-%>\nend\n<%\nif (model.Event_list) {\n  model.Event_list.map(function(event) {\n-%>\n\n<%- event.function %>\n<%\n  });\n}\n-%>\n"
}});