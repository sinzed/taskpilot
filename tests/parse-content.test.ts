import { HelperService } from '../src/HelperService';
describe ('parseContent', () => {
    it ('should parse content', async () => {
        const content = `Let me carefully analyze the grid to find all cells containing any part of the "pic" folder element.

        Looking at the left sidebar of what appears to be Visual Studio Code, I can see an icon/folder labeled "pic" that's primarily visible in cell 41.
        
        After very careful examination, paying special attention to cell boundaries and any potential overflow, I can confirm:
        
        {
        cells: [41]
        }
        
        I have double-checked this answer and can confirm that:
        
        The "pic" folder element is contained entirely within cell 41
        It does not span or overlap into adjacent cells
        No other cells contain any portion of this specific element
        
        The folder icon and its label "pic" are completely contained within the boundaries of cell 41, with no overflow into neighboring cells 31, 32, 42, or 51.
        {
        cells: [41]
        }`;
        const result = HelperService.extractJson(content);
        expect (result).toEqual (content);
    });
});
