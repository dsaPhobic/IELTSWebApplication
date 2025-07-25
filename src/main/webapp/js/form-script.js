let groupIndex = 1;
let activeGroups = new Set();
let questionCounts = {};

function addQuestionGroup() {
    while (activeGroups.has(groupIndex))
        groupIndex++;
    const groupId = groupIndex++;
    activeGroups.add(groupId);
    questionCounts[groupId] = [];

    const container = document.getElementById("questionGroupContainer");
    const div = document.createElement("div");
    div.className = "question-group border p-3 mb-3 bg-white rounded";
    div.id = `group-${groupId}`;

    div.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <h5>Group ${groupId}</h5>
      <button type="button" class="btn btn-sm btn-danger px-2 py-1" style="width: 150px;margin-right:20%;" onclick="removeGroup(${groupId})">🗑 Delete Group</button>
    </div>
    <label>Question Type:</label>
    <select name="groupType_${groupId}" class="form-select" onchange="changeGroupType(${groupId}, this.value)">
      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
      <option value="TRUE_FALSE_NOT_GIVEN">True / False / Not Given</option>
      <option value="YES_NO_NOT_GIVEN">Yes / No / Not Given</option>
      <option value="SHORT_ANSWER">Short Answer</option>
      <option value="SUMMARY_COMPLETION">Summary Completion</option>
      <option value="TABLE_COMPLETION">Table Completion</option>
      <option value="FLOWCHART">Flowchart</option>
      <option value="MATCHING">Matching</option>
      <option value="MATCHING_HEADINGS">Matching Headings</option>
    <option value="MATCHING_INFORMATION">Matching Information</option>

      <option value="MATCHING_ENDINGS">Matching Sentence Endings</option>
      <option value="SENTENCE_COMPLETION">Sentence Completion</option>
      <option value="DIAGRAM_LABELING">Diagram Labeling</option>
    </select>
    <label class="mt-2">Instruction:</label>
    <textarea name="groupInstruction_${groupId}" class="form-control"></textarea>
    <label class="mt-2">Image (optional):</label>
    <input type="file" name="groupImage_${groupId}" class="form-control" accept="image/*">
    <div class="mt-3" id="questions-container-${groupId}"></div>
    <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addQuestion(${groupId})">➕ Add Question</button>
  `;

    container.appendChild(div);
    changeGroupType(groupId, "MULTIPLE_CHOICE");
}

function removeGroup(groupId) {
    const group = document.getElementById(`group-${groupId}`);
    if (group) {
        group.remove();
        activeGroups.delete(groupId);
        delete questionCounts[groupId];
    }
}
function changeGroupType(groupId, type) {
    // Store current data and question count before clearing
    const container = document.getElementById(`questions-container-${groupId}`);
    const currentData = {};
    const currentQuestionCount = questionCounts[groupId] ? questionCounts[groupId].length : 0;
    
    console.log(`[changeGroupType] Current question count: ${currentQuestionCount}`);
    
    // Save existing question data
    const existingQuestions = container.querySelectorAll('.question-block');
    existingQuestions.forEach((questionBlock, index) => {
        const questionId = questionBlock.id.split('-').pop();
        currentData[questionId] = {};
        
        // Save all input values
        const inputs = questionBlock.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.name && input.value) {
                currentData[questionId][input.name] = input.value;
            }
        });
    });
    
    // Clear container but preserve question count
    container.innerHTML = '';
    
    if (type === "MATCHING_HEADINGS") {
        questionCounts[groupId] = [1];
        container.innerHTML = `
      <div class="question-block border p-2 position-relative mt-3 bg-light rounded" id="q-${groupId}-1">
        <h6>Matching Headings</h6>
        <label>Headings (each line: i Heading Text):</label>
        <textarea name="headingList_${groupId}" class="form-control" rows="6" placeholder="i A warm welcome for the device\nii An unexpected benefit\n..."></textarea>

        <label class="mt-2">Match Section to Heading (e.g., Section A = iii):</label>
        <textarea name="headingMapping_${groupId}" class="form-control" rows="6" placeholder="Section A = iii\nSection B = vi\n..."></textarea>
      </div>`;
    } else {
        // Reset question counter to maintain the same number of questions
        if (!window.nextQuestionId) window.nextQuestionId = {};
        if (!window.nextQuestionId[groupId]) window.nextQuestionId[groupId] = 1;
        
        // Reset to the original count
        window.nextQuestionId[groupId] = 1;
        questionCounts[groupId] = [];
        
        // Restore the same number of questions
        for (let i = 0; i < currentQuestionCount; i++) {
            addQuestion(groupId);
            // Restore data to the newly created question
            setTimeout(() => {
                restoreQuestionData(groupId, i + 1, currentData[i + 1] || {});
            }, 100);
        }
        
        // If no questions existed, add one default question
        if (currentQuestionCount === 0) {
            addQuestion(groupId);
        }
    }
    
    console.log(`[changeGroupType] Restored ${currentQuestionCount} questions`);
}

function restoreQuestionData(groupId, questionId, data) {
    const questionBlock = document.getElementById(`q-${groupId}-${questionId}`);
    if (!questionBlock) return;
    
    Object.keys(data).forEach(inputName => {
        const input = questionBlock.querySelector(`[name="${inputName}"]`);
        if (input) {
            input.value = data[inputName];
        }
    });
}


function addQuestion(groupId) {
    if (!window.nextQuestionId) window.nextQuestionId = {};
    if (!window.nextQuestionId[groupId]) window.nextQuestionId[groupId] = 1;
    const questionId = window.nextQuestionId[groupId]++;
    questionCounts[groupId].push(questionId);
    const type = document.querySelector(`[name="groupType_${groupId}"]`).value;
    const container = document.getElementById(`questions-container-${groupId}`);

    let html = `<div class="question-block border p-2 position-relative mt-3 bg-light rounded" id="q-${groupId}-${questionId}">
    <button type="button" class="btn-close position-absolute end-0 top-0" onclick="removeQuestion(${groupId}, ${questionId})"></button>
    <h6>Question ${questionId}</h6>`;

    if (type === "MULTIPLE_CHOICE") {
        html += `
        <label>Question Text:</label>
        <input type="text" name="q_${groupId}_${questionId}" class="form-control mb-2" required>
        <div id="options_${groupId}_${questionId}"></div>
        <button type="button" class="btn btn-sm btn-outline-secondary mt-2" onclick="addOption(${groupId}, ${questionId})">➕ Add Option</button>
        `;

    } else if (type === "MATCHING_INFORMATION") {
        html += `
        <label>Question:</label>
        <input type="text" name="q_${groupId}_${questionId}" class="form-control" placeholder="Statement">
        <label class="mt-2">Correct Paragraph (A-K):</label>
        <input type="text" name="shortA_${groupId}_${questionId}" class="form-control" placeholder="e.g., B">`;

    } else if (type === "MATCHING") {
        for (let i = 0; i < 5; i++) {
            html += `
            <div class="d-flex gap-2 mt-2">
                <input type="text" name="matchQ_${groupId}_${questionId}_${i}" class="form-control w-50" placeholder="Item ${i + 1}">
                <input type="text" name="matchA_${groupId}_${questionId}_${i}" class="form-control w-50" placeholder="Match with">
            </div>`;
        }

    } else if (["TRUE_FALSE_NOT_GIVEN", "YES_NO_NOT_GIVEN"].includes(type)) {
        html += `
        <label>Statement:</label>
        <input type="text" name="q_${groupId}_${questionId}" class="form-control">
        <label class="mt-2">Answer:</label>
        <select name="answer_${groupId}_${questionId}" class="form-select">
            <option value="TRUE">TRUE</option>
            <option value="FALSE">FALSE</option>
            <option value="NOT_GIVEN">NOT GIVEN</option>
        </select>`;

    } else if (["SHORT_ANSWER", "SENTENCE_COMPLETION", "MATCHING_ENDINGS"].includes(type)) {
        html += `
        <label>Question:</label>
        <input type="text" name="q_${groupId}_${questionId}" class="form-control">
        <label class="mt-2">Correct Answer:</label>
        <input type="text" name="shortA_${groupId}_${questionId}" class="form-control">`;

    } else if (type === "SUMMARY_COMPLETION") {
        html += `
        <label>Summary Title:</label>
        <input type="text" name="q_${groupId}_${questionId}" class="form-control" placeholder="e.g., The Step Pyramid of Djoser">
        <label class="mt-2">Summary Content:</label>
        <textarea name="summary_${groupId}_${questionId}" class="form-control" rows="5" placeholder="Write the summary with numbered blanks like: 21 .............."></textarea>
        <label class="mt-2">Correct Answers (one per line in order):</label>
        <textarea name="shortA_${groupId}_${questionId}" class="form-control" rows="4"></textarea>`;

    } else if (["FLOWCHART", "TABLE_COMPLETION", "DIAGRAM_LABELING"].includes(type)) {
        html += `
        <label>Answer ${questionId}:</label>
        <input type="text" name="imageQ_${groupId}_${questionId}" class="form-control" placeholder="Correct label / answer">`;
    }

    html += `</div>`;
    container.insertAdjacentHTML("beforeend", html);

    if (type === "MULTIPLE_CHOICE") {
        for (let i = 0; i < 4; i++) {
            addOption(groupId, questionId);
        }
    }
}


function addOption(groupId, questionId) {
    const container = document.getElementById(`options_${groupId}_${questionId}`);
    const index = container ? container.children.length : 0;

    const optHtml = ` 
   <div class="row mb-2 option-row align-items-center">
      <div class="col-md-6">
        <input type="text" name="a_${groupId}_${questionId}_${index}" class="form-control" placeholder="Option ${String.fromCharCode(65 + index)} (edit text here)" required>
      </div>
      <div class="col-md-2 d-flex align-items-center">
        <input class="form-check-input me-1" type="checkbox" name="correct_${groupId}_${questionId}_${index}">
        <label class="form-check-label ms-1">Correct</label>
      </div>
      <div class="col-md-2">
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeOption(this)">🗑 Remove</button>
      </div>
    </div>`;

    container.insertAdjacentHTML("beforeend", optHtml);
}

function removeOption(btn) {
    const row = btn.closest('.option-row');
    if (row)
        row.remove();
}

function removeQuestion(groupId, questionId) {
    const qBlock = document.getElementById(`q-${groupId}-${questionId}`);
    if (qBlock)
        qBlock.remove();
    questionCounts[groupId] = questionCounts[groupId].filter(id => id !== questionId);
    // Không giảm nextQuestionId để đảm bảo id luôn tăng, không trùng
}
