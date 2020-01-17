import fs from 'memfs';

import loader from '../src';

// eslint-disable-next-line consistent-return
const validate = (options) => {
  try {
    loader.call(
      Object.assign(
        {},
        {
          query: options,
          loaders: [],
          resolve: () => {},
          loadModule: () => {},
          fs,
          getResolve: () => () => {},
          async: () => (error) => {
            if (error) {
              throw error;
            }
          },
        }
      ),
      `
      @width: 10px;
      #header {
        width: @width;
      }
`
    );
    return 'Success';
  } catch (err) {
    return err.toString();
  }
};

const options = {
  failed: [{ wrong: 'options' }, { lint: 'shouldBeBool' }],
  success: [
    { color: true },
    { globalVars: '__Global_Primary' },
    { globalVars: ['__Global_Primary'] },
  ],
};

options.failed.forEach((option, index) => {
  it(`validate failed options #${index}`, () => {
    expect(validate(option)).toMatchSnapshot();
  });
});

options.success.forEach((option, index) => {
  it(`validate success options #${index}`, () => {
    expect(validate(option)).toBe('Success');
  });
});
